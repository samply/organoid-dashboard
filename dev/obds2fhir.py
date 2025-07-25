#!/usr/bin/env python3
"""
obds2fhir.py - Convert OBDS XML files to FHIR JSON bundles

This script converts XML files from the tum-obds-data directory to FHIR-compliant
JSON bundles (patient.json and observation.json) in the tum-fhir-bundles directory.
"""

import xml.etree.ElementTree as ET
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional, Union


class OBDSToFHIRConverter:
    def __init__(self, input_dir: str, output_dir: str):
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.patients = []
        self.observations = []
        self.patient_counter = 1
        self.observation_counter = 1
        
        # Namespace for XML parsing
        self.namespace = {'obds': 'http://www.basisdatensatz.de/oBDS/XML'}
    
    def process_all_files(self):
        """Process all XML files in the input directory"""
        if not os.path.exists(self.input_dir):
            raise FileNotFoundError(f"Input directory {self.input_dir} not found")
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Process each XML file
        for filename in os.listdir(self.input_dir):
            if filename.endswith('.xml'):
                xml_path = os.path.join(self.input_dir, filename)
                print(f"Processing {filename}...")
                self.process_xml_file(xml_path)
        
        # Generate FHIR bundles
        self.generate_patient_bundle()
        self.generate_observation_bundle()
        
        print(f"Conversion complete! Generated {len(self.patients)} patients and {len(self.observations)} observations.")
    
    def process_xml_file(self, xml_path: str):
        """Process a single XML file and extract patient and observation data"""
        try:
            tree = ET.parse(xml_path)
            root = tree.getroot()
            
            # Find all patients in the file
            patients = root.findall('.//obds:Patient', self.namespace)
            
            for patient_elem in patients:
                patient_id = patient_elem.get('Patient_ID')
                if not patient_id:
                    continue
                
                # Create patient resource
                patient_resource = self.create_patient_resource(patient_id)
                self.patients.append(patient_resource)
                
                # Process observations for this patient
                observations = patient_elem.findall('.//obds:Observation', self.namespace)
                for obs_elem in observations:
                    observation_resource = self.create_observation_resource(obs_elem, self.patient_counter, patient_id)
                    self.observations.append(observation_resource)
                
                self.patient_counter += 1
        
        except ET.ParseError as e:
            print(f"Error parsing {xml_path}: {e}")
        except Exception as e:
            print(f"Error processing {xml_path}: {e}")
    
    def create_patient_resource(self, patient_id: str) -> Dict[str, Any]:
        """Create a FHIR Patient resource"""
        return {
            "fullUrl": f"Patient/{self.patient_counter}",
            "resource": {
                "resourceType": "Patient",
                "id": str(self.patient_counter),
                "meta": {
                    "profile": [
                        "http://dktk.dkfz.de/fhir/StructureDefinition/onco-core-Patient-Pseudonym"
                    ]
                },
                "identifier": [
                    {
                        "type": {
                            "coding": [
                                {
                                    "system": "http://dktk.dkfz.de/fhir/onco/core/CodeSystem/PseudonymArtCS",
                                    "code": "Lokal"
                                }
                            ]
                        },
                        "value": patient_id
                    }
                ]
            },
            "request": {
                "method": "PUT",
                "url": f"Patient/{self.patient_counter}"
            }
        }
    
    def create_observation_resource(self, obs_elem: ET.Element, patient_id: int, patient_pseudonym: str) -> Dict[str, Any]:
        """Create a FHIR Observation resource from XML observation element"""
        observation_id = obs_elem.get('Observation_ID', f"obs_{self.observation_counter}")
        
        # Get profile name
        profile_elem = obs_elem.find('.//obds:ProfileName', self.namespace)
        profile_name = profile_elem.text if profile_elem is not None else ""
        
        # Create base observation structure
        observation = {
            "fullUrl": f"Observation/{self.observation_counter}",
            "resource": {
                "resourceType": "Observation",
                "id": str(self.observation_counter),
                "code": {
                    "coding": [
                        {
                            "system": "https://fhir.centraxx.de/system/finding/shortname"
                        }
                    ]
                },
                "subject": {
                    "reference": f"Patient/{patient_id}"
                },
                "method": {
                    "coding": [
                        {
                            "system": "https://fhir.centraxx.de/system/laborMethod",
                            "version": "2",
                            "code": profile_name
                        }
                    ]
                },
                "component": [
                    {
                        "code": {
                            "coding": [
                                {
                                    "system": "https://fhir.centraxx.de/system/laborValue",
                                    "code": "SIOP_PATIENT_PSEUDONYM"
                                }
                            ]
                        },
                        "valueString": patient_pseudonym
                    }
                ]
            },
            "request": {
                "method": "PUT",
                "url": f"Observation/{self.observation_counter}"
            }
        }
        
        # Process parameters
        parameters = obs_elem.findall('.//obds:Parameter', self.namespace)
        for param in parameters:
            component = self.create_observation_component(param)
            if component:
                observation["resource"]["component"].append(component)
        
        self.observation_counter += 1
        return observation
    
    def create_observation_component(self, param_elem: ET.Element) -> Optional[Dict[str, Any]]:
        """Create an observation component from a parameter element"""
        # Get the code
        code_elem = param_elem.find('.//obds:Code', self.namespace)
        if code_elem is None:
            return None
        
        code = code_elem.text
        component: Dict[str, Any] = {
            "code": {
                "coding": [
                    {
                        "system": "https://fhir.centraxx.de/system/laborValue",
                        "code": code
                    }
                ]
            }
        }
        
        # Determine value type and extract value
        value_quantity = param_elem.find('.//obds:ValueQuantity', self.namespace)
        value_datetime = param_elem.find('.//obds:ValueDateTime', self.namespace)
        value_codeable = param_elem.find('.//obds:ValueCodeableConcept', self.namespace)
        value_string = param_elem.find('.//obds:ValueString', self.namespace)
        
        if value_quantity is not None:
            value_elem = value_quantity.find('.//obds:Value', self.namespace)
            unit_elem = value_quantity.find('.//obds:Unit', self.namespace)
            
            if value_elem is not None and value_elem.text is not None:
                try:
                    # Detect if it's an integer or float based on presence of decimal point
                    if '.' in value_elem.text:
                        value = float(value_elem.text)
                    else:
                        value = int(value_elem.text)
                    
                    value_quantity_dict: Dict[str, Union[str, int, float]] = {"value": value}
                    if unit_elem is not None and unit_elem.text is not None and unit_elem.text.strip():
                        value_quantity_dict["unit"] = unit_elem.text
                    component["valueQuantity"] = value_quantity_dict
                except (ValueError, TypeError):
                    if value_elem.text:
                        component["valueString"] = value_elem.text
        
        elif value_datetime is not None and value_datetime.text is not None:
            # Convert datetime to ISO format if needed
            datetime_str = value_datetime.text
            
            # Handle the invalid date 1999-02-29 (not a leap year)
            if datetime_str == "1999-02-29":
                datetime_str = "1999-02-28"
            
            try:
                # Try to parse and reformat datetime
                dt = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
                component["valueDateTime"] = dt.isoformat()
            except:
                component["valueDateTime"] = datetime_str
        
        elif value_codeable is not None:
            code_elem = value_codeable.find('.//obds:Code', self.namespace)
            if code_elem is not None and code_elem.text is not None:
                code_value = code_elem.text
                
                # Convert gender codes if this is a gender field
                if code and code == "SIOP_GENDER":
                    gender_mapping = {
                        "M": "MALE",
                        "W": "FEMALE", 
                        "D": "DIVERSE"
                    }
                    code_value = gender_mapping.get(code_value, "NA")
                
                component["valueCodeableConcept"] = {
                    "coding": [
                        {
                            "code": code_value
                        }
                    ]
                }
        
        elif value_string is not None and value_string.text is not None:
            component["valueString"] = value_string.text
        
        else:
            # Try to find any text content as fallback
            for child in param_elem:
                if child.text and child.text.strip():
                    component["valueString"] = child.text.strip()
                    break
        
        return component
    
    def generate_patient_bundle(self):
        """Generate the patient.json FHIR bundle"""
        bundle = {
            "resourceType": "Bundle",
            "type": "transaction",
            "entry": self.patients
        }
        
        output_path = os.path.join(self.output_dir, "patient.json")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(bundle, f, indent=4, ensure_ascii=False)
        
        print(f"Generated patient bundle: {output_path}")
    
    def generate_observation_bundle(self):
        """Generate the observation.json FHIR bundle"""
        bundle = {
            "resourceType": "Bundle",
            "type": "transaction",
            "entry": self.observations
        }
        
        output_path = os.path.join(self.output_dir, "observation.json")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(bundle, f, indent=4, ensure_ascii=False)
        
        print(f"Generated observation bundle: {output_path}")


def main():
    """Main function to run the converter"""
    # Define input and output directories
    input_dir = "dev/tum-obds-data"
    output_dir = "dev/tum-fhir-bundles"
    
    # Check if we're running from the project root
    if not os.path.exists(input_dir):
        # Try relative to script location
        script_dir = os.path.dirname(os.path.abspath(__file__))
        input_dir = os.path.join(script_dir, input_dir)
        output_dir = os.path.join(script_dir, output_dir)
    
    if not os.path.exists(input_dir):
        print(f"Error: Input directory {input_dir} not found")
        print("Make sure you're running this script from the project root directory")
        return
    
    # Create converter and process files
    converter = OBDSToFHIRConverter(input_dir, output_dir)
    converter.process_all_files()


if __name__ == "__main__":
    main()
