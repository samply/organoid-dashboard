import json


def patient(id: int) -> dict:
    return {
        "fullUrl": f"Patient/{id}",
        "resource": {
            "resourceType": "Patient",
            "id": str(id),
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
                                "code": "Lokal",
                            }
                        ]
                    },
                    # "value": "ABCDEF",
                }
            ],
            # "gender": "male",
        },
        "request": {"method": "PUT", "url": f"Patient/{id}"},
    }


def decimal_or_integer(code, value, unit=""):
    result = {
        "code": {
            "coding": [
                {
                    "system": "https://fhir.centraxx.de/system/laborValue",
                    "code": code,
                    # "display": "Number of liver metastases (intraoperative imaging)",
                }
            ]
        },
        "valueQuantity": {
            "value": value,
            "unit": unit,
        },
    }
    if unit == "":
        del result["valueQuantity"]["unit"]
    return result


def longdate(code, value):
    return {
        "code": {
            "coding": [
                {
                    "system": "https://fhir.centraxx.de/system/laborValue",
                    "code": code,
                    # "display": "Date of tumor resection",
                }
            ]
        },
        "valueDateTime": value,
    }


def string_or_longstring(code, value):
    return {
        "code": {
            "coding": [
                {
                    "system": "https://fhir.centraxx.de/system/laborValue",
                    "code": code,
                    # "display": "SIOrgP-Pseudonym",
                }
            ]
        },
        "valueString": value,
    }


def selectmany_or_selectone(code: str, values: list[str]):
    result = {
        "code": {
            "coding": [
                {
                    "system": "https://fhir.centraxx.de/system/laborValue",
                    "code": code,
                    # "display": "Adjuvant CTx - regime",
                }
            ]
        },
        "valueCodeableConcept": {"coding": []},
    }
    for value in values:
        result["valueCodeableConcept"]["coding"].append(
            {
                "system": "urn:centraxx:CodeSystem/ValueList-179",
                "code": value,
            }
        )
    return result


def observation(id: int, patient_id: int, profile_code: str, components) -> dict:
    return {
        "fullUrl": f"Observation/{id}",
        "resource": {
            "resourceType": "Observation",
            "id": str(id),
            # "status": "unknown",
            "code": {
                "coding": [
                    {
                        "system": "https://fhir.centraxx.de/system/finding/shortname",
                        # "code": "SIOrgP - MetPredict - Visite 1: Stammdaten Patient_07/31/2024 10:47:40"
                    }
                ]
            },
            "subject": {"reference": f"Patient/{patient_id}"},
            # "effectiveDateTime": "2024-07-31",
            "method": {
                "coding": [
                    {
                        "system": "https://fhir.centraxx.de/system/laborMethod",
                        "version": "2",
                        "code": profile_code,
                    }
                ]
            },
            "component": components,
        },
        "request": {"method": "PUT", "url": f"Observation/{id}"},
    }


def bundle(entries):
    return {"resourceType": "Bundle", "type": "transaction", "entry": entries}


def write_json_files(patient_file, observation_file):
    patients = [patient(42), patient(43)]
    observations = [
        observation(1, 42, "PROFILE_SIOP_METPREDICT_VISIT-2B_SAMPLE_COLLECTION", [
            longdate("SIOP_DATE_OF_VISITE", "2024-10-23T00:00:00+02:00"),
            string_or_longstring("SIOP_PATIENT_PSEUDONYM", "MetP-P42"),
            string_or_longstring("SIOP_SAMPLE_M01_PSEUDONYM", "MetP-P42-t1-M1"),
            string_or_longstring("SIOP_SAMPLE_M02_PSEUDONYM", "MetP-P42-t1-M2"),
            string_or_longstring("SIOP_SAMPLE_M03_PSEUDONYM", "MetP-P42-t1-M3"),
        ]),
        observation(2, 42, "PROFILE_SIOP_METPREDICT_VISIT-1_PATIENTDATA", [
            string_or_longstring("SIOP_PATIENT_PSEUDONYM", "MetP-P42"),
            decimal_or_integer("SIOP_AGE_STUDY_ENROLLMENT", 55, "YEARS"),
            selectmany_or_selectone("SIOP_GENDER", ["MALE"]),
            selectmany_or_selectone("SIOP_LOCALISATION_PRIMARY_TUMOR", ["COLON"]),
            selectmany_or_selectone("SIOP_LOCALISATION_PRIMARY_TUMOR_COLON", ["COLON_ASCENDENS"]),
            selectmany_or_selectone("SIOP_TNM_C-T", ["T2"]),
            selectmany_or_selectone("SIOP_TNM_C-N", ["N2"]),
            # selectmany_or_selectone("SIOP_NEOADJ_T_RECTAL_CARCINOMA", ["YES"]),
            selectmany_or_selectone("SIOP_NEOADJ_RCTX_RT_LONG_COURSE", ["YES"]),
            selectmany_or_selectone("SIOP_NEOADJ_RTX_RT_SHORT_COURSE", ["NO"]),
            selectmany_or_selectone("SIOP_NEOADJ_TNT", ["YES"]),
            selectmany_or_selectone("SIOP_NEOADJ_RCTX_CT_REGIMEN", ["CAPECITABIN"]),
            selectmany_or_selectone("SIOP_NEOADJ_TNT_CT_REGIMEN", ["OTH"]),
            string_or_longstring("SIOP_NEOADJ_TNT_CT_REGIMEN_OTHER", "Phantasie"),
            selectmany_or_selectone("SIOP_NEOADJ_CTX_MET", ["YES"]),
            selectmany_or_selectone("SIOP_NEOADJ_CTX_REGIMEN_METPREDICT", ["FOLFOX"]),
            selectmany_or_selectone("SIOP_NEOADJ_CTX_ANTIBODIES", ["CETUXIMAB"]),
        ]),

        observation(3, 43, "PROFILE_SIOP_NEOMATCH_VISIT-2B_SAMPLE_COLLECTION", [
            longdate("SIOP_DATE_OF_VISITE", "2025-04-10T00:00:00+02:00"),
            string_or_longstring("SIOP_PATIENT_PSEUDONYM", "NeoM-P43"),
            selectmany_or_selectone("SIOP_SAMPLE_LOCALISATION", ["PANCREASTAIL"]),
            selectmany_or_selectone("SIOP_SAMPLE_COLLECTION", ["EUS"]),
        ]),
        observation(4, 43, "PROFILE_SIOP_NEOMATCH_VISIT-2B_SAMPLE_COLLECTION", [
            longdate("SIOP_DATE_OF_VISITE", "2024-04-11T00:00:00+02:00"),
            string_or_longstring("SIOP_PATIENT_PSEUDONYM", "NeoM-P43"),
            selectmany_or_selectone("SIOP_SAMPLE_LOCALISATION", ["OTH"]),
            string_or_longstring("SIOP_SAMPLE_LOCALISATION_OTHER", "Phantasielokalisation"),
            selectmany_or_selectone("SIOP_SAMPLE_COLLECTION", ["OP"]),
            # string_or_longstring("SIOP_SAMPLE_COLLECTION_OTHER", "Phantasieentnahme"),
        ]),
        observation(5, 43, "PROFILE_SIOP_NEOMATCH_VISIT-1A_PATIENTDATA", [
            string_or_longstring("SIOP_PATIENT_PSEUDONYM", "NeoM-P43"),
            decimal_or_integer("SIOP_AGE_STUDY_ENROLLMENT", 65, "YEARS"),
            selectmany_or_selectone("SIOP_GENDER", ["FEMALE"]),
            selectmany_or_selectone("SIOP_TNM_C-T", ["T1"]),
            selectmany_or_selectone("SIOP_TNM_C-N", ["N1"]),
            selectmany_or_selectone("SIOP_TNM_C-M", ["M1"]),
            selectmany_or_selectone("SIOP_NEOADJ_CTX", ["YES"]),
        ]),
        observation(6, 43, "PROFILE_SIOP_NEOMATCH_VISIT-1B_NEOADJUVANT_CTX", [
            string_or_longstring("SIOP_PATIENT_PSEUDONYM", "NeoM-P43"),
            selectmany_or_selectone("SIOP_NEOADJ_CTX_REGIMEN_NEOMATCH", ["FOLFIRINOX"]),
            selectmany_or_selectone("SIOP_NEOADJ_CTX_ADDITIONAL_RT", ["NO"]),
        ])
    ]
    with open(patient_file, "w") as f:
        json.dump(bundle(patients), f, indent=4)
    with open(observation_file, "w") as f:
        json.dump(bundle(observations), f, indent=4)


write_json_files(
    "dev/json-fhir-bundles/patient.json", "dev/json-fhir-bundles/observation.json"
)
