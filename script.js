document.addEventListener('DOMContentLoaded', () => {
    const sbdInput = document.getElementById('sbdInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultContainer = document.getElementById('resultContainer');
    let studentData = [];

    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(header => header.trim());
        const students = [];
        const knownStringColumns = ['sbd', 'họ và tên'];

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
                students.push(student);
            }
        }
        console.log("Parsed student data (first 5 entries):", JSON.stringify(students.slice(0,5), null, 2));
        return students;
    }

    async function loadStudentData() {
        try {
            const response = await fetch('diem.csv');
            if (!response.ok) {
                resultContainer.innerHTML = '<p style="color: red;">Lỗi: Không thể tải file dữ liệu điểm (diem.csv).</p>';
                console.error('Failed to fetch diem.csv:', response.statusText);
                return false;
            }
            const csvText = await response.text();
            studentData = parseCSV(csvText);
            if (studentData.length === 0) {
                resultContainer.innerHTML = '<p style="color: orange;">Lưu ý: File diem.csv có vẻ trống hoặc không đúng định dạng.</p>';
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

        const sbdKey = Object.keys(data).find(key => key.toLowerCase() === 'sbd') || 'SBD';
        const hoTenKey = Object.keys(data).find(key => key.toLowerCase() === 'họ và tên') || 'Họ và tên';
        const tongDiemKey = Object.keys(data).find(key => key.toLowerCase() === 'tổng điểm') || 'Tổng điểm';
        const subjectKeys = Object.keys(data).filter(key => {
            const lowerKey = key.toLowerCase();
            return lowerKey !== sbdKey.toLowerCase() &&
                   lowerKey !== hoTenKey.toLowerCase() &&
                   lowerKey !== tongDiemKey.toLowerCase() && 
                   !isNaN(parseFloat(data[key])); 
        });

        let tableHTML = `
            <caption>Kết quả tra cứu cho SBD: ${data[sbdKey] !== undefined ? data[sbdKey] : 'N/A'}</caption>
            <thead>
                <tr>
                    <th>${hoTenKey}</th>`;
        
        subjectKeys.forEach(key => {
            tableHTML += `<th>${key}</th>`;
        });
        
        tableHTML += `<th>${tongDiemKey}</th></tr></thead><tbody><tr>
                    <td>${data[hoTenKey] !== undefined ? data[hoTenKey] : 'N/A'}</td>`;

        subjectKeys.forEach(key => {
            const score = parseFloat(data[key]);
            tableHTML += `<td>${!isNaN(score) ? score : (data[key] || 'N/A')}</td>`; 
        });
        
        tableHTML += `<td>${data[tongDiemKey] !== undefined ? data[tongDiemKey] : 'N/A'}</td>`;
        tableHTML += `</tr></tbody>`;
        
        const scoreTable = document.createElement('table');
        scoreTable.innerHTML = tableHTML;
        resultContainer.appendChild(scoreTable);

        scoreTable.style.width = '100%';
        scoreTable.style.borderCollapse = 'collapse';
        scoreTable.style.marginTop = '20px';
        const thTdStyles = 'border: 1px solid #ddd; padding: 8px; text-align: left;';
        scoreTable.querySelectorAll('th, td').forEach(cell => cell.style.cssText = thTdStyles);
        scoreTable.querySelector('caption').style.fontWeight = 'bold';
        scoreTable.querySelector('caption').style.marginBottom = '10px';
    }
}); 