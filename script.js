document.addEventListener('DOMContentLoaded', () => {
    const sbdInput = document.getElementById('sbdInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultContainer = document.getElementById('resultContainer');
    let studentData = [];

    function isValidScore(score) {
        if (!score || score === '') return false;
        if (typeof score === 'string') {
            if (score.toUpperCase() === 'VẮNG' || score.toUpperCase() === 'VANG') return false;
            const numValue = parseFloat(score);
            return !isNaN(numValue);
        }
        return !isNaN(parseFloat(score));
    }

    function calculateTotalScore(student) {
        let total = 0;
        const subjects = ['Toán', 'Văn', 'Anh'];
        subjects.forEach(subject => {
            if (student[subject] && isValidScore(student[subject])) {
                total += parseFloat(student[subject]);
            }
        });
        return total;
    }

    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(header => header.trim());
        const students = [];
        const knownStringColumns = ['sbd', 'họ và tên', 'ngày tháng năm sinh', 'giới tính', 'số phòng', 'điểm thi'];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(value => value.trim());
            if (values.length === headers.length) {
                const student = {};
                headers.forEach((header, index) => {
                    const lowerHeader = header.toLowerCase();
                    if (knownStringColumns.includes(lowerHeader)) {
                        student[header] = values[index];
                    } else {
                        const numValue = parseFloat(values[index]);
                        student[header] = isNaN(numValue) ? values[index] : numValue;
                    }
                });
                // Calculate total score for each student
                student['Tổng điểm'] = calculateTotalScore(student);
                students.push(student);
            }
        }
        console.log("Parsed student data (first 5 entries):", JSON.stringify(students.slice(0,5), null, 2));
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
            studentData = parseCSV(csvText);
            if (studentData.length === 0) {
                resultContainer.innerHTML = '<p style="color: orange;">Lưu ý: File diem_thi.csv có vẻ trống hoặc không đúng định dạng.</p>';
                return false;
            }
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
        if (studentData.length === 0 || !studentData[0]) return null;
        const sbdKey = Object.keys(studentData[0]).find(key => key.toLowerCase() === 'sbd');
        if (!sbdKey) {
            console.error("Không tìm thấy cột SBD ('sbd') trong dữ liệu đã xử lý.");
            return null;
        }
        return studentData.find(student => student[sbdKey] && student[sbdKey].toLowerCase() === sbdToFind.toLowerCase());
    }

    searchBtn.addEventListener('click', async () => {
        const sbd = sbdInput.value.trim();
        if (sbd === '') {
            resultContainer.innerHTML = '<p style="color: red;">Vui lòng nhập số báo danh.</p>';
            return;
        }

        if (studentData.length === 0) {
            const loaded = await loadStudentData();
            if (!loaded) {
                resultContainer.innerHTML = '<p style="color: red;">Dữ liệu điểm chưa được tải. Vui lòng thử lại sau.</p>';
                return;
            }
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
            const displayScore = isValidScore(score) ? parseFloat(score).toFixed(2) : (score || 'N/A');
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