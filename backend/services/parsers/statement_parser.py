import pandas as pd
import re
from datetime import datetime
import os
from werkzeug.utils import secure_filename

class StatementParser:
    """Base class for parsing bank statements."""
    
    def __init__(self, file_path, file_type):
        self.file_path = file_path
        self.file_type = file_type.lower()
        self.transactions = []
    
    def parse(self):
        """Parse the file and return transactions."""
        if self.file_type == 'csv':
            return self._parse_csv()
        elif self.file_type == 'pdf':
            return self._parse_pdf()
        elif self.file_type in ['xls', 'xlsx']:
            return self._parse_excel()
        else:
            raise ValueError(f"Unsupported file type: {self.file_type}")
    
    def _parse_csv(self):
        """Parse CSV statement."""
        raise NotImplementedError("CSV parsing not implemented in base class")
    
    def _parse_pdf(self):
        """Parse PDF statement."""
        raise NotImplementedError("PDF parsing not implemented in base class")
    
    def _parse_excel(self):
        """Parse Excel statement."""
        raise NotImplementedError("Excel parsing not implemented in base class")
    
    def _clean_amount(self, amount_str):
        """Convert amount string to float."""
        if not amount_str or pd.isna(amount_str):
            return 0.0
        
        # Remove currency symbols and commas
        amount_str = re.sub(r'[$£€,]', '', str(amount_str))
        
        # Handle parentheses for negative numbers
        if '(' in amount_str and ')' in amount_str:
            amount_str = amount_str.replace('(', '-').replace(')', '')
        
        try:
            return float(amount_str)
        except ValueError:
            return 0.0
    
    def _format_date(self, date_str, date_format='%m/%d/%Y'):
        """Convert date string to datetime object."""
        if isinstance(date_str, datetime):
            return date_str
        
        try:
            return datetime.strptime(date_str, date_format)
        except (ValueError, TypeError):
            return datetime.now()

class ChaseStatementParser(StatementParser):
    """Parser for Chase bank statements."""
    
    def _parse_csv(self):
        """Parse Chase CSV statement."""
        try:
            df = pd.read_csv(self.file_path)
            
            # Expected columns for Chase CSV format
            expected_columns = ['Transaction Date', 'Post Date', 'Description', 'Category', 'Type', 'Amount', 'Memo']
            
            # Check if CSV has the expected format
            if not all(col in df.columns for col in ['Transaction Date', 'Description', 'Amount']):
                raise ValueError("CSV does not appear to be a Chase statement format")
            
            transactions = []
            for _, row in df.iterrows():
                amount = self._clean_amount(row['Amount'])
                
                transaction = {
                    'date': self._format_date(row['Transaction Date']),
                    'description': row['Description'],
                    'amount': amount,
                    'category_hint': row.get('Category', ''),
                    'notes': row.get('Memo', '')
                }
                transactions.append(transaction)
            
            self.transactions = transactions
            return transactions
            
        except Exception as e:
            raise ValueError(f"Failed to parse Chase CSV statement: {str(e)}")
    
    def _parse_pdf(self):
        """Parse Chase PDF statement."""
        # PDF parsing requires more complex libraries like PyPDF2 or pdfplumber
        raise NotImplementedError("Chase PDF parsing not implemented yet")

class BankOfAmericaStatementParser(StatementParser):
    """Parser for Bank of America statements."""
    
    def _parse_csv(self):
        """Parse Bank of America CSV statement."""
        try:
            df = pd.read_csv(self.file_path)
            
            # Check if CSV has the expected format
            if not all(col in df.columns for col in ['Date', 'Description', 'Amount']):
                raise ValueError("CSV does not appear to be a Bank of America statement format")
            
            transactions = []
            for _, row in df.iterrows():
                amount = self._clean_amount(row['Amount'])
                
                transaction = {
                    'date': self._format_date(row['Date']),
                    'description': row['Description'],
                    'amount': amount,
                    'category_hint': row.get('Category', ''),
                    'notes': ''
                }
                transactions.append(transaction)
            
            self.transactions = transactions
            return transactions
            
        except Exception as e:
            raise ValueError(f"Failed to parse Bank of America CSV statement: {str(e)}")

class GenericStatementParser(StatementParser):
    """Generic parser for CSV statements with flexible column mapping."""
    
    def __init__(self, file_path, file_type, column_mapping=None):
        super().__init__(file_path, file_type)
        self.column_mapping = column_mapping or {
            'date': 'Date',
            'description': 'Description',
            'amount': 'Amount'
        }
    
    def _parse_csv(self):
        """Parse a generic CSV statement using column mapping."""
        try:
            df = pd.read_csv(self.file_path)
            
            # Validate that the required columns exist
            required_columns = [self.column_mapping['date'], self.column_mapping['description'], self.column_mapping['amount']]
            if not all(col in df.columns for col in required_columns):
                raise ValueError(f"CSV is missing required columns. Expected: {required_columns}")
            
            transactions = []
            for _, row in df.iterrows():
                amount = self._clean_amount(row[self.column_mapping['amount']])
                
                transaction = {
                    'date': self._format_date(row[self.column_mapping['date']]),
                    'description': row[self.column_mapping['description']],
                    'amount': amount,
                    'category_hint': row.get(self.column_mapping.get('category', ''), ''),
                    'notes': row.get(self.column_mapping.get('notes', ''), '')
                }
                transactions.append(transaction)
            
            self.transactions = transactions
            return transactions
            
        except Exception as e:
            raise ValueError(f"Failed to parse generic CSV statement: {str(e)}")
    
    def _parse_excel(self):
        """Parse a generic Excel statement using column mapping."""
        try:
            df = pd.read_excel(self.file_path)
            
            # Validate that the required columns exist
            required_columns = [self.column_mapping['date'], self.column_mapping['description'], self.column_mapping['amount']]
            if not all(col in df.columns for col in required_columns):
                raise ValueError(f"Excel file is missing required columns. Expected: {required_columns}")
            
            transactions = []
            for _, row in df.iterrows():
                amount = self._clean_amount(row[self.column_mapping['amount']])
                
                transaction = {
                    'date': self._format_date(row[self.column_mapping['date']]),
                    'description': row[self.column_mapping['description']],
                    'amount': amount,
                    'category_hint': row.get(self.column_mapping.get('category', ''), ''),
                    'notes': row.get(self.column_mapping.get('notes', ''), '')
                }
                transactions.append(transaction)
            
            self.transactions = transactions
            return transactions
            
        except Exception as e:
            raise ValueError(f"Failed to parse generic Excel statement: {str(e)}")

def get_parser_for_file(file_path, file_type, bank_name=None, column_mapping=None):
    """Factory function to get the appropriate parser based on file and bank."""
    if bank_name:
        bank_name = bank_name.lower()
        if 'chase' in bank_name:
            return ChaseStatementParser(file_path, file_type)
        elif 'bank of america' in bank_name or 'bofa' in bank_name:
            return BankOfAmericaStatementParser(file_path, file_type)
    
    # Default to generic parser
    return GenericStatementParser(file_path, file_type, column_mapping)

def save_uploaded_file(uploaded_file, upload_dir):
    """Save an uploaded file and return the file path."""
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    
    filename = secure_filename(uploaded_file.filename)
    file_path = os.path.join(upload_dir, filename)
    
    uploaded_file.save(file_path)
    return file_path

def detect_file_type(filename):
    """Detect file type from filename."""
    _, extension = os.path.splitext(filename)
    return extension.lower()[1:]  # Remove the dot

def parse_uploaded_statement(uploaded_file, bank_name=None, column_mapping=None):
    """Parse an uploaded bank statement file."""
    # Save the uploaded file
    upload_dir = os.path.join(os.getcwd(), 'uploads')
    file_path = save_uploaded_file(uploaded_file, upload_dir)
    
    # Detect file type
    file_type = detect_file_type(uploaded_file.filename)
    
    # Get appropriate parser
    parser = get_parser_for_file(file_path, file_type, bank_name, column_mapping)
    
    # Parse the file
    transactions = parser.parse()
    
    # Clean up (optional)
    os.remove(file_path)
    
    return transactions