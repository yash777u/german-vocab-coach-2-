import os
import pandas as pd
import glob

VOCAB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vocab_files")

def get_available_levels():
    """Scand vocab_files directory and return list of levels (e.g. A1, A2, Movie, etc.)

    File name format: <prefix>_vocab.<extension> (e.g. A1_vocab.xlsx, Movie_vocab.xlsx)
    Returns:
        List of levels sorted alphabetically.
    """
    if not os.path.exists(VOCAB_DIR):
        return []
    
    levels = []
    # Match any files starting with prefix and ending with _vocab.<ext>
    for f in os.listdir(VOCAB_DIR):
        if not os.path.isfile(os.path.join(VOCAB_DIR, f)):
            continue
        
        name, ext = os.path.splitext(f)
        ext = ext.lower()
        if ext in [".xls", ".xlsx", ".ods", ".csv", ".excel"]:
            if name.lower().endswith("_vocab"):
                level_name = name[:-6].strip() # Get prefix before _vocab
                if level_name:
                    levels.append(level_name)
    
    # Custom alphabetical & numeric sort (e.g. A1, A2, B1, B2)
    def level_sort_key(s):
        import re
        parts = re.split(r'(\d+)', s)
        return [int(text) if text.isdigit() else text.lower() for text in parts]
        
    return sorted(list(set(levels)), key=level_sort_key)

def load_level_data(level_prefix):
    """Load all sheet-wise (day-wise) data from the corresponding level Excel file."""
    if not os.path.exists(VOCAB_DIR):
        return {}
        
    # Find matching files
    pattern = os.path.join(VOCAB_DIR, f"{level_prefix}_vocab.*")
    matching_files = glob.glob(pattern)
    if not matching_files:
        return {}
        
    file_path = matching_files[0]
    _, ext = os.path.splitext(file_path)
    ext = ext.lower()
    
    days_data = {}
    
    try:
        if ext == ".csv":
            df = pd.read_csv(file_path)
            days_data["Day 1"] = sanitize_dataframe(df)
        else:
            xl = pd.ExcelFile(file_path)
            for sheet_name in xl.sheet_names:
                df = xl.parse(sheet_name)
                cleaned_sheet_name = sheet_name.strip()
                days_data[cleaned_sheet_name] = sanitize_dataframe(df)
    except Exception as e:
        print(f"Error loading level data for {level_prefix}: {e}")
        return {}
        
    return days_data

def sanitize_dataframe(df):
    """Normalize and clean vocab dataframes to ensure option values and phonetic strings are loaded."""
    # Strip headers
    df.columns = [str(c).strip().lower() for c in df.columns]
    
    # Map synonyms if columns have different names
    column_mapping = {
        'german word': 'german_word',
        'german': 'german_word',
        'translation': 'meaning',
        'Meaning': 'meaning',
        'meaning': 'meaning',
        'example': 'example_sentence',
        'example sentence': 'example_sentence',
        'pronunciation': 'pronunciation',
        'phonetic': 'pronunciation',
        'option1': 'option_1',
        'option2': 'option_2',
        'option3': 'option_3',
        'option4': 'option_4',
    }
    
    df = df.rename(columns=column_mapping)
    
    # Check if necessary columns exist, if not create them
    required_cols = ["german_word", "meaning", "pronunciation", "example_sentence", "gender", "emoji", "keyword", "note"]
    for col in required_cols:
        if col not in df.columns:
            df[col] = ""
            
    for i in range(1, 5):
        opt_col = f"option_{i}"
        if opt_col not in df.columns:
            df[opt_col] = ""
            
    # Remove rows where german_word or meaning is empty
    df = df.dropna(subset=["german_word", "meaning"])
    df = df[df["german_word"].astype(str).str.strip() != ""]
    
    # Convert all columns appropriately and fill string NaNs
    for col in df.columns:
        df[col] = df[col].fillna("").astype(str).str.strip()
        
    # Generate unique index for resource mapping/caching
    df["_row_idx"] = [str(i) for i in range(len(df))]
    return df
