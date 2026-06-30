import pandas as pd
import numpy as np

# =========================
# 1. LOAD DATA
# =========================
file_path = "Statewise_General_Index_Upto_Feb24.csv"
df = pd.read_csv(file_path)

print("Original Shape:", df.shape)

# =========================
# 2. BASIC CLEANING
# =========================
df = df.drop_duplicates()
df.columns = df.columns.str.strip().str.replace(" ", "_")

# =========================
# 3. CREATE FULL YEAR RANGE (2011 - 2024)
# =========================
all_years = list(range(2011, 2025))
existing_years = df['Year'].unique()

print(f"Existing years: {sorted(existing_years)}")
print(f"Adding missing years from 2011 to 2024...")

# Get all unique combinations of Sector and other categorical columns
sectors = df['Sector'].unique() if 'Sector' in df.columns else ['Rural+Urban']

# Create full grid
full_index = pd.MultiIndex.from_product([all_years, sectors], names=['Year', 'Sector'])
full_df = pd.DataFrame(index=full_index).reset_index()

# Merge with existing data
df = pd.merge(full_df, df, on=['Year', 'Sector'], how='left')

# =========================
# 4. FILL MISSING VALUES (Forward Fill + Mean)
# =========================
numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns

# Forward fill within each sector
for sector in sectors:
    mask = df['Sector'] == sector
    df.loc[mask, numeric_cols] = df.loc[mask, numeric_cols].fillna(method='ffill')

# Fill remaining NaNs with overall mean
df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())

print("Missing values filled.")

# =========================
# 5. FINAL TOUCHES
# =========================
df = df.sort_values(['Year', 'Sector'])

# Save
df.to_csv("cleaned_dataset_final.csv", index=False)

print("\n✅ Final Shape:", df.shape)
print("Years included:", sorted(df['Year'].unique()))
print("File saved as 'cleaned_dataset_final.csv'")