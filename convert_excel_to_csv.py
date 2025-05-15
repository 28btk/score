import pandas as pd
import os

# Define the input Excel file path
excel_file_path = os.path.join('data', 'diem.xlsx')

# Define the output CSV file path
csv_file_path = os.path.join('data', 'diem.csv')

def convert_excel_to_utf8_csv(excel_path, csv_path):
    """
    Reads an Excel file and saves its first sheet as a CSV file encoded in UTF-8.

    Args:
        excel_path (str): The path to the input Excel file.
        csv_path (str): The path where the output CSV file will be saved.
    """
    try:
        # Check if the Excel file exists
        if not os.path.exists(excel_path):
            print(f"Lỗi: Không tìm thấy file Excel tại đường dẫn: {excel_path}")
            return

        # Read the Excel file (by default, reads the first sheet)
        # You can specify a sheet name or index if needed, e.g., pd.read_excel(excel_path, sheet_name='Sheet1')
        df = pd.read_excel(excel_path)

        # Ensure the directory for the CSV file exists
        os.makedirs(os.path.dirname(csv_path), exist_ok=True)

        # Save the DataFrame to a CSV file with UTF-8 encoding
        df.to_csv(csv_path, index=False, encoding='utf-8-sig') 
        # Using 'utf-8-sig' ensures that a BOM (Byte Order Mark) is added,
        # which helps some applications (like older versions of Excel) correctly recognize UTF-8.
        # For web applications, 'utf-8' is usually sufficient, but 'utf-8-sig' is generally safer for broader compatibility.

        print(f"Thành công: File Excel '{excel_path}' đã được chuyển đổi thành CSV tại '{csv_path}' với encoding UTF-8.")

    except FileNotFoundError:
        print(f"Lỗi: File Excel đầu vào không tìm thấy tại '{excel_path}'.")
    except Exception as e:
        print(f"Đã xảy ra lỗi trong quá trình chuyển đổi: {e}")

if __name__ == "__main__":
    # Create a dummy data/diem.xlsx if it doesn't exist for testing purposes
    # In a real scenario, the user would provide this file.
    if not os.path.exists(excel_file_path):
        print(f"Cảnh báo: File Excel '{excel_file_path}' không tồn tại. Vui lòng tạo file này hoặc đặt đúng đường dẫn.")
        print("Nếu bạn muốn tạo một file Excel mẫu để thử nghiệm, hãy bỏ comment phần code tạo file mẫu bên dưới script này.")
        # Example: Create a dummy Excel file for testing
        # dummy_data = {
        #     'SBD': ['SBD001', 'SBD002', 'SBD003'],
        #     'HoTen': ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường'],
        #     'Toan': [8, 7, 9],
        #     'Van': [7, 8, 7.5],
        #     'Anh': [9, 6, 8]
        # }
        # dummy_df = pd.DataFrame(dummy_data)
        # os.makedirs(os.path.dirname(excel_file_path), exist_ok=True)
        # dummy_df.to_excel(excel_file_path, index=False, engine='openpyxl')
        # print(f"Đã tạo file Excel mẫu tại '{excel_file_path}' để thử nghiệm.")

    convert_excel_to_utf8_csv(excel_file_path, csv_file_path) 