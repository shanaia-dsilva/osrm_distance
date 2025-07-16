import pandas as pd
import io
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class DataProcessor:
    def __init__(self):
        self.required_columns = [
            'Vehicle Number',
            'Institute',
            'Point 1 latitude',
            'Point 1 longitude',
            'Point 2 latitude',
            'Point 2 longitude'
        ]
    
    def validate_columns(self, df: pd.DataFrame) -> bool:
        missing_columns = [col for col in self.required_columns if col not in df.columns]
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            return False
        return True
    
    def validate_coordinates(self, df: pd.DataFrame) -> Dict[str, Any]:
        issues = []
        
        coordinate_columns = [
            'Point 1 latitude',
            'Point 1 longitude',
            'Point 2 latitude',
            'Point 2 longitude'
        ]
        
        for col in coordinate_columns:
            if col in df.columns:
                non_numeric = df[~pd.to_numeric(df[col], errors='coerce').notna()]
                if not non_numeric.empty:
                    issues.append(f"Non-numeric values in {col}: rows {non_numeric.index.tolist()}")
                
                numeric_values =pd.to_numeric(df[col], errors='coerce')
                if 'latitude' in col.lower():
                    out_of_range= numeric_values[(numeric_values < -90) | (numeric_values > 90)]
                    if not out_of_range.empty:
                        issues.append(f"Invalid latitude values in {col}: {out_of_range.index.tolist()}")
                elif 'longitude' in col.lower():
                    out_of_range = numeric_values[(numeric_values < -180) | (numeric_values > 180)]
                    if not out_of_range.empty:
                        issues.append(f"Invalid longitude values in {col}: {out_of_range.index.tolist()}")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues
        }
    
    def process_csv_file(self, file) -> pd.DataFrame:
        try:
            df = pd.read_csv(file)
            
            if not self.validate_columns(df):
                raise ValueError(f"Missing required columns. Expected: {self.required_columns}")
            
            validation_result = self.validate_coordinates(df)
            if not validation_result['valid']:
                raise ValueError(f"Data validation failed: {'; '.join(validation_result['issues'])}")
            
            df = self.clean_data(df)
            
            logger.info(f"Successfully processed CSV file with {len(df)} rows")
            return df
            
        except Exception as e:
            logger.error(f"Error processing CSV file: {str(e)}")
            raise
    
    def process_pasted_data(self, content: str) -> pd.DataFrame:
        try:
            content = content.strip()
            if not content:
                raise ValueError("No data provided")
    
            delimiter = self.detect_delimiter(content)
            df = pd.read_csv(io.StringIO(content), delimiter=delimiter)
            
            if not self.validate_columns(df):
                raise ValueError(f"Missing required columns. Expected: {self.required_columns}")
            
            validation_result = self.validate_coordinates(df)
            if not validation_result['valid']:
                raise ValueError(f"Data validation failed: {'; '.join(validation_result['issues'])}")
            
            df = self.clean_data(df)
            logger.info(f"Successfully processed pasted data with {len(df)} rows")
            return df
            
        except Exception as e:
            logger.error(f"Error processing pasted data: {str(e)}")
            raise
    
    def detect_delimiter(self, content: str) -> str:
        
        first_line = content.split('\n')[0]
        delimiters = {
            '\t': first_line.count('\t'),
            ',': first_line.count(','),
            ';': first_line.count(';'),
            '|': first_line.count('|')
        }
        delimiter = max(delimiters, key=delimiters.get)
        if delimiters[delimiter] == 0:
            delimiter = ','
        logger.debug(f"Detected delimiter: '{delimiter}'")
        return delimiter
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        df =df.dropna(how='all')
        string_columns = ['Vehicle Number', 'Institute']
        for col in string_columns:
            if col in df.columns:
                df[col] = df[col].astype(str).str.strip()
        
        coordinate_columns = [
            'Point 1 latitude',
            'Point 1 longitude',
            'Point 2 latitude',
            'Point 2 longitude'
        ]
        for col in coordinate_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        df=df.dropna(subset=coordinate_columns)
        df=df.reset_index(drop=True)
        
        return df
    
    def get_preview_data(self, df: pd.DataFrame, num_rows: int = 5) -> Dict[str, Any]:
        preview_df = df.head(num_rows)
        
        return {
            'columns': df.columns.tolist(),
            'rows': preview_df.values.tolist(),
            'total_rows':len(df),
            'preview_rows': len(preview_df)
        }
    
    def create_sample_data(self) -> pd.DataFrame:
        sample_data = {
            'Vehicle Number': ['VH001', 'VH002', 'VH003'],
            'Institute': ['Institute A', 'Institute B', 'Institute C'],
            'Point 1 latitude': [40.7128, 34.0522, 41.8781],
            'Point 1 longitude': [-74.0060, -118.2437, -87.6298],
            'Point 2 latitude': [40.7589, 34.0522, 41.8781],
            'Point 2 longitude': [-73.9851, -118.2437, -87.6298]
        }
        
        return pd.DataFrame(sample_data)
