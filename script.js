document.addEventListener('DOMContentLoaded', () => {
    const sbdInput = document.getElementById('sbdInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultContainer = document.getElementById('resultContainer');
    let studentData = [];

    function isValidScore(score) {
        if (!score || score === '') return false;
        if (typeof score === 'string') {
            if (score.toUpperCase() === 'VẮNG' || score.toUpperCase() === 'VANG') return false;
            // Replace comma with dot for decimal points
            const normalizedScore = score.replace(',', '.');
            const numValue = parseFloat(normalizedScore);
            return !isNaN(numValue);
        }
        return !isNaN(parseFloat(score));
    }

    function parseScore(score) {
        if (!score || score === '') return null;
        if (typeof score === 'string') {
            if (score.toUpperCase() === 'VẮNG' || score.toUpperCase() === 'VANG') return 'VẮNG';
            // Replace comma with dot for decimal points
            const normalizedScore = score.replace(',', '.');
            const numValue = parseFloat(normalizedScore);
            return isNaN(numValue) ? score : numValue;
        }
        return isNaN(parseFloat(score)) ? score : parseFloat(score);
    }

    function calculateTotalScore(student) {
        let total = 0;
        const subjects = ['Toán', 'Văn', 'Anh'];
        subjects.forEach(subject => {
            if (student[subject] && isValidScore(student[subject])) {
                const score = parseScore(student[subject]);
                if (typeof score === 'number') {
                    total += score;
                }
            }
        });
        return total;
    }

    function parseCSV(csvText) {
        console.log("Raw CSV text (first 500 chars):", csvText.substring(0, 500));
        
        // Split by newlines and remove empty lines
        const lines = csvText.split('\n').filter(line => line.trim());
        console.log("Number of lines:", lines.length);
        console.log("First line (headers):", lines[0]);
        
        if (lines.length < 2) return [];

        // Split headers and clean them
        const headers = lines[0].split(',').map(header => header.trim());
        console.log("Parsed headers:", headers);
        
        const students = [];
        const knownStringColumns = ['sbd', 'họ và tên', 'ngày tháng năm sinh', 'giới tính', 'số phòng', 'điểm thi'];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Skip empty lines
            
            // Split by comma but handle quoted values
            const values = [];
            let currentValue = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim()); // Add the last value
            
            if (values.length === headers.length) {
                const student = {};
                headers.forEach((header, index) => {
                    const lowerHeader = header.toLowerCase();
                    if (knownStringColumns.includes(lowerHeader)) {
                        student[header] = values[index];
                    } else {
                        student[header] = parseScore(values[index]);
                    }
                });
                // Calculate total score for each student
                student['Tổng điểm'] = calculateTotalScore(student);
                students.push(student);
            } else {
                console.warn(`Line ${i + 1} has incorrect number of columns:`, values);
            }
        }
        
        // Log the first few students for debugging
        console.log("First 3 students in parsed data:", students.slice(0, 3));
        
        // Check if we can find the specific SBD
        const targetSBD = "GV-000015";
        const foundStudent = students.find(s => s['SBD'] === targetSBD);
        console.log(`Looking for SBD ${targetSBD}:`, foundStudent ? "Found" : "Not found");
        if (foundStudent) {
            console.log("Found student data:", foundStudent);
        }
        
        return students;
    }

    async function loadStudentData() {
        try {
            const response = await fetch('diem_thi.csv');
            if (!response.ok) {
                resultContainer.innerHTML = '<p style="color: red;">Lỗi: Không thể tải file dữ liệu điểm (diem_thi.csv).</p>';
                console.error('Failed to fetch diem_thi.csv:', response.statusText);
                return false;
            }
            const csvText = await response.text();
            console.log("CSV file loaded successfully");
            studentData = parseCSV(csvText);
            if (studentData.length === 0) {
                resultContainer.innerHTML = '<p style="color: orange;">Lưu ý: File diem_thi.csv có vẻ trống hoặc không đúng định dạng.</p>';
                return false;
            }
            console.log(`Successfully loaded ${studentData.length} student records`);
            return true;
        } catch (error) {
            resultContainer.innerHTML = '<p style="color: red;">Lỗi khi xử lý file dữ liệu điểm.</p>';
            console.error('Error loading or parsing student data:', error);
            return false;
        }
    }

    loadStudentData().then(loaded => {
        if (loaded) {
            console.log("Dữ liệu điểm đã được tải và xử lý.");
        } else {
            console.warn("Không thể tải dữ liệu điểm. Chức năng tra cứu có thể không hoạt động.");
        }
    });

    function findStudentBySBD(sbdToFind) {
        if (studentData.length === 0 || !studentData[0]) {
            console.error("No student data available");
            return null;
        }

        // Log all available fields in the first student record
        console.log("Available fields in data:", Object.keys(studentData[0]));
        
        // Log the first few SBDs for debugging
        console.log("First few SBDs in data:", studentData.slice(0, 5).map(s => s['SBD']));
        console.log("Searching for SBD:", sbdToFind);

        // Try different possible SBD field names
        const possibleSbdFields = ['SBD', 'sbd', 'Số báo danh', 'Số Báo Danh', 'SBD', 'SBD'];
        let sbdKey = null;

        // Find the correct SBD field name
        for (const field of possibleSbdFields) {
            if (studentData[0][field] !== undefined) {
                sbdKey = field;
                console.log("Found SBD field:", field);
                break;
            }
        }

        if (!sbdKey) {
            console.error("Could not find SBD field in data. Available fields:", Object.keys(studentData[0]));
            return null;
        }

        // Trim and normalize both the search SBD and the data SBDs
        const normalizedSearchSBD = sbdToFind.trim();
        
        // Log all SBDs in the data for debugging
        console.log("All SBDs in data:", studentData.map(s => s[sbdKey]));
        
        // Find the student with matching SBD
        const student = studentData.find(student => {
            const studentSBD = String(student[sbdKey]).trim();
            const isMatch = studentSBD === normalizedSearchSBD;
            console.log(`Comparing: "${studentSBD}" with "${normalizedSearchSBD}" => ${isMatch}`);
            return isMatch;
        });

        if (!student) {
            console.log("No matching student found");
            // Log all students for debugging
            console.log("All students:", studentData);
        } else {
            console.log("Found matching student:", student);
        }

        return student;
    }

    searchBtn.addEventListener('click', async () => {
        const sbd = sbdInput.value.trim();
        if (sbd === '') {
            resultContainer.innerHTML = '<p style="color: red;">Vui lòng nhập số báo danh.</p>';
            return;
        }

        console.log("Starting search for SBD:", sbd);
        console.log("Current studentData length:", studentData.length);

        if (studentData.length === 0) {
            console.log("No data loaded, attempting to load data...");
            const loaded = await loadStudentData();
            if (!loaded) {
                resultContainer.innerHTML = '<p style="color: red;">Dữ liệu điểm chưa được tải. Vui lòng thử lại sau.</p>';
                return;
            }
            console.log("Data loaded successfully, length:", studentData.length);
        }
        
        const student = findStudentBySBD(sbd);

        if (student) {
            displayScores(student);
        } else {
            resultContainer.innerHTML = `<p style="color: orange;">Không tìm thấy thông tin cho số báo danh: <strong>${sbd}</strong>.</p>`;
        }
    });

    function displayScores(data) {
        resultContainer.innerHTML = '';
        if (!data) {
            resultContainer.innerHTML = '<p style="color: red;">Lỗi: Dữ liệu không hợp lệ để hiển thị.</p>';
            return;
        }

        const infoFields = ['SBD', 'HỌ VÀ TÊN', 'NGÀY THÁNG NĂM SINH', 'GIỚI TÍNH', 'Số Phòng', 'Điểm thi'];
        const scoreFields = ['Toán', 'Văn', 'Anh', 'Tổng điểm'];

        let tableHTML = `
            <div class="student-info">
                <h2>Thông tin học sinh</h2>
                <table class="info-table">
                    <tbody>`;
        
        infoFields.forEach(field => {
            if (data[field] !== undefined) {
                tableHTML += `
                    <tr>
                        <th>${field}:</th>
                        <td>${data[field]}</td>
                    </tr>`;
            }
        });
        
        tableHTML += `
                    </tbody>
                </table>
            </div>
            <div class="score-info">
                <h2>Kết quả điểm</h2>
                <table class="score-table">
                    <thead>
                        <tr>`;
        
        scoreFields.forEach(field => {
            tableHTML += `<th>${field}</th>`;
        });
        
        tableHTML += `
                        </tr>
                    </thead>
                    <tbody>
                        <tr>`;
        
        scoreFields.forEach(field => {
            const score = data[field];
            let displayScore;
            if (field === 'Tổng điểm') {
                displayScore = typeof score === 'number' ? score.toFixed(2) : 'N/A';
            } else {
                displayScore = isValidScore(score) ? parseScore(score).toFixed(2) : (score || 'N/A');
            }
            tableHTML += `<td>${displayScore}</td>`;
        });
        
        tableHTML += `
                        </tr>
                    </tbody>
                </table>
            </div>`;
        
        resultContainer.innerHTML = tableHTML;
    }
}); 