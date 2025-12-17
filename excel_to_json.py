import csv
import json

values = {
  "metpredict_patients": 0,
  "neomatch_patients": 0,
  "metpredict_organoids": 0,
  "neomatch_organoids": 0,
  "patients_age_lt_30": 0,
  "patients_age_31_40": 0,
  "patients_age_41_50": 0,
  "patients_age_51_60": 0,
  "patients_age_gt_60": 0,
  "unknown_age_patients": 0,
  "male_patients": 0,
  "female_patients": 0,
  "diverse_patients": 0,
  "unknown_gender_patients": 0,
  "organoids_from_metastasis": 0,
  "organoids_from_untreated_primary_tumor": 0,
  "organoids_from_treated_primary_tumor": 0,
  "organoids_from_unknown_site": 0,
  "metpredict_patients_with_1_organoids": 0,
  "metpredict_patients_with_2_organoids": 0,
  "metpredict_patients_with_3_organoids": 0,
  "metpredict_patients_with_4_organoids": 0,
  "metpredict_patients_with_5_organoids": 0,
  "metpredict_patients_with_gt_5_organoids": 0,
  "neomatch_patients_with_untreated_organoids": 0,
  "neomatch_patients_with_treated_organoids": 0,
  "neomatch_patients_with_matched_organoids": 0,
}

with open("20251209_SIOrgP_aggregierteDaten_Template_combined.csv", "r") as csvfile:
    next(csvfile) # Skip first line
    reader = csv.DictReader(csvfile)
    for row in reader:
        match row["Altersgruppe Patient"]:
            case "≤30":
                values["patients_age_lt_30"] += 1
            case "31-40":
                values["patients_age_31_40"] += 1
            case "41-50":
                values["patients_age_41_50"] += 1
            case "51-60":
                values["patients_age_51_60"] += 1
            case "≥61":
                values["patients_age_gt_60"] += 1
            case "unknown":
                values["unknown_age_patients"] += 1
            case _:
                raise ValueError(f"Unknown age group: {row['Altersgruppe Patient']}")
        match row["Geschlecht Patient"]:
            case "Male":
                values["male_patients"] += 1
            case "Female":
                values["female_patients"] += 1
            case "Unkown": # Typo in the original data
                values["unknown_gender_patients"] += 1
            case _:
                raise ValueError(f"Unknown gender: {row['Geschlecht Patient']}")
        match row["Projekt"]:
            case "MetPredict":
                num_organoids = int(row["Gesamt PDO-Anzahl des Patienten"])
                values["metpredict_patients"] += 1
                values["metpredict_organoids"] += num_organoids
                values["organoids_from_metastasis"] += num_organoids
                if num_organoids == 1:
                    values["metpredict_patients_with_1_organoids"] += 1
                elif num_organoids == 2:
                    values["metpredict_patients_with_2_organoids"] += 1
                elif num_organoids == 3:
                    values["metpredict_patients_with_3_organoids"] += 1
                elif num_organoids == 4:
                    values["metpredict_patients_with_4_organoids"] += 1
                elif num_organoids == 5:
                    values["metpredict_patients_with_5_organoids"] += 1
                elif num_organoids > 5:
                    values["metpredict_patients_with_gt_5_organoids"] += 1
            case "NeoMatch":
                num_untreated = int(row["PDO-Anzahl des Patienten vom unbehandeltem Tumor"])
                num_treated = int(row["PDO-Anzahl des Patienten vom behandeltem Tumor"])
                values["neomatch_patients"] += 1
                values["neomatch_organoids"] += int(row["Gesamt PDO-Anzahl des Patienten"])
                values["organoids_from_untreated_primary_tumor"] += num_untreated
                values["organoids_from_treated_primary_tumor"] += num_treated
                if num_untreated > 0 and num_treated == 0:
                    values["neomatch_patients_with_untreated_organoids"] += 1
                elif num_treated > 0 and num_untreated == 0:
                    values["neomatch_patients_with_treated_organoids"] += 1
                elif num_untreated > 0 and num_treated > 0:
                    values["neomatch_patients_with_matched_organoids"] += 1
            case _:
                raise ValueError(f"Unknown project: {row['Projekt']}")

with open("excel.json", "w") as jsonfile:
    json.dump(values, jsonfile, indent=2)
