document.addEventListener('DOMContentLoaded', function() {
    const newMemberAddBtn = document.querySelector('.createBtn button'),
        darkBg = document.querySelector('.dark_bg'),
        popupForm = document.querySelector('.popup'),
        crossBtn = document.querySelector('.btn-close'),
        submitBtn = document.querySelector('.submitBtn'),
        modalTitle = document.querySelector('.modal-title'),
        form = document.querySelector('#createProgramForm'),
        formInputFields = document.querySelectorAll('#createProgramForm input, #createProgramForm select');

    const itemsDiv = document.getElementById('items');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
    const pageInfo = document.getElementById('page-info');
    let currentPage = 1;
    const limit = 20;

    let originalData = localStorage.getItem('programs') ? JSON.parse(localStorage.getItem('programs')) : [];
    let getData = [...originalData];

    let isEdit = false,
        editId;

    document.getElementById("menu-toggle").addEventListener("click", function() {
        document.getElementById("wrapper").classList.toggle("toggled");
        document.querySelector(".main-content").classList.toggle("toggled");
        document.querySelector(".header-right").classList.toggle("toggled");
    });

    // Add event listeners to filter elements
    document.querySelectorAll('input[name="nameSort"]').forEach(input => {
        input.addEventListener('change', applyFiltersAndSort);
    });
    document.querySelectorAll('input[name="typeFilter"]').forEach(input => {
        input.addEventListener('change', applyFiltersAndSort);
    });
    document.querySelectorAll('input[name="frequencyFilter"]').forEach(input => {
        input.addEventListener('change', applyFiltersAndSort);
    });
    document.querySelectorAll('input[name="assistanceTypeFilter"]').forEach(input => {
        input.addEventListener('change', applyFiltersAndSort);
    });

    $('#resetFiltersButton').on('click', function() {
        $('#filter-form')[0].reset();
        applyFiltersAndSort();
    });

    newMemberAddBtn.addEventListener('click', () => {
        isEdit = false;
        submitBtn.innerHTML = "Submit";
        modalTitle.innerHTML = "Fill the Form";
        form.reset();
        formInputFields.forEach(input => input.disabled = false);
        submitBtn.style.display = "block";
    });

    crossBtn.addEventListener('click', () => {
        form.reset();
        submitBtn.style.display = "block";
        formInputFields.forEach(input => input.disabled = false);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const now = new Date();
        const program = {
            id: Date.now(),
            programName: form.programName.value,
            programType: form.programType.value,
            programFrequency: form.programFrequency.value,
            assistanceType: form.assistanceType.value,
            dateCreated: now.toLocaleDateString(),
            lastUpdated: now.toLocaleDateString() + ' ' + now.toLocaleTimeString()
        };

        if (!isEdit) {
            originalData.push(program);
        } else {
            originalData[editId] = program;
        }

        $.post("/programs/create", program, (data, status, xhr) => {
            if (status === "success" && xhr.status === 201) {
                alert("Program has been created.");
                location.reload();
            }
        });

        localStorage.setItem('programs', JSON.stringify(originalData));
        getData = [...originalData];

        location.reload();
        darkBg.classList.remove('active');
        popupForm.classList.remove('active');
        form.reset();
    });

    document.getElementById("editProgramForm").addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission
        let program_id = document.getElementById("editProgramId").value;
        let program_name = document.getElementById("editProgramName").value;
        let program_type = document.getElementById("editProgramType").value;
        let program_frequency = document.getElementById("editFrequency").value;
        let program_assistance_type = document.getElementById("editAssistanceType").value;

        let program = {
            id: program_id,
            name: program_name,
            program_type: program_type,
            frequency: program_frequency,
            assistance_type: program_assistance_type
        };

        $.post("/programs/edit", program, (data, status, xhr) => {
            if (status === "success" && xhr.status === 200) {
                let modalInstance = bootstrap.Modal.getInstance(document.getElementById("modal-program-edit"));
                modalInstance.hide();
                alert("Update program successfully.");
                location.reload();
            } else {
                alert("Error updating program");
            }
        }).fail(() => {
            alert("Error updating program");
        });
    });

    // Edit and delete event handlers
    function addEventListeners() {
        document.querySelectorAll('.editBtn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.closest("tr").getAttribute('data-program-id');
                editInfo(id, e);
            });
        });
        document.querySelectorAll('.deleteBtn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                deleteInfo(id, e);
            });
        });
    }

    function onBtnEditClick(e) {
        e.preventDefault(); // Prevent default form submission
        let program_id = e.currentTarget.closest("tr").getAttribute("data-program-id");
        let program_name = e.currentTarget.closest("tr").querySelector("td:nth-child(2)").textContent;
        let program_type = e.currentTarget.closest("tr").querySelector(".program-type").textContent;
        let program_frequency = e.currentTarget.closest("tr").querySelector(".program-frequency").textContent;
        let program_assistance_type = e.currentTarget.closest("tr").querySelector(".program-assistance-type").textContent;

        let modal_edit = document.getElementById("modal-program-edit");
        let modal_edit_id = modal_edit.querySelector("#editProgramId");
        let modal_edit_name = modal_edit.querySelector("#editProgramName");
        let modal_edit_type = modal_edit.querySelector("#editProgramType");
        let modal_edit_frequency = modal_edit.querySelector("#editFrequency");
        let modal_edit_assistance_type = modal_edit.querySelector("#editAssistanceType");

        modal_edit_id.value = program_id;
        modal_edit_name.value = program_name;
        modal_edit_type.value = program_type;
        modal_edit_frequency.value = program_frequency;
        modal_edit_assistance_type.value = program_assistance_type;
    }

    function editInfo(id, e) {
        onBtnEditClick(e);
        isEdit = true;
        editId = getData.findIndex(item => item.id === id);
        const program = getData[editId];
        if (program) {
            form.programName.value = program.programName;
            form.programType.value = program.programType;
            form.frequency.value = program.frequency;
            form.assistanceType.value = program.assistanceType;
            modalTitle.innerHTML = "Edit Program";
            formInputFields.forEach(input => input.disabled = false);
            submitBtn.style.display = "block";
            submitBtn.innerHTML = "Update";
            darkBg.classList.add('active');
            popupForm.classList.add('active');
        }
    }

    function deleteInfo(id, e) {
        if (confirm("Are you sure you want to delete this program?")) {
            originalData = originalData.filter(item => item.id !== id);
            localStorage.setItem('programs', JSON.stringify(originalData));

            $.post(`/programs/delete`, { program_id: id })
                .done((data, status, xhr) => {
                    if (status === "success" && xhr.status === 200) {
                        alert("Program has been deleted.");
                        location.reload();
                    } else {
                        alert("Failed to delete program. Please try again.");
                    }
                })
                .fail((xhr, status, error) => {
                    alert("Error deleting program. Please try again later.");
                    console.error(error);
                });
        }
    }

    // Filter and sort function
    function applyFiltersAndSort() {
        const nameSort = $('input[name="nameSort"]:checked').val();
        const typeFilter = $('input[name="typeFilter"]:checked').map(function() { return this.value; }).get();
        const frequencyFilter = $('input[name="frequencyFilter"]:checked').map(function() { return this.value; }).get();
        const assistanceTypeFilter = $('input[name="assistanceTypeFilter"]:checked').map(function() { return this.value; }).get();

        let query = [];

        if (nameSort) query.push(`nameSort=${nameSort}`);
        if (typeFilter.length) query.push(`typeFilter=${typeFilter.join(',')}`);
        if (frequencyFilter.length) query.push(`frequencyFilter=${frequencyFilter.join(',')}`);
        if (assistanceTypeFilter.length) query.push(`assistanceTypeFilter=${assistanceTypeFilter.join(',')}`);

        const queryString = query.length > 0 ? `?${query.join('&')}` : '';

        console.log('Query String:', queryString);

        fetch(`/programs${queryString}`)
            .then(response => response.text())
            .then(html => {
                console.log('Received HTML:', html);
                const newDoc = new DOMParser().parseFromString(html, 'text/html');
                const newTableBody = newDoc.querySelector('tbody').innerHTML;
                document.querySelector('tbody').innerHTML = newTableBody;
                addEventListeners();
            })
            .catch(error => console.error('Error fetching filtered data:', error));
    }

    function fetchItems(page = 1) {
        fetch(`/programs?page=${page}&limit=${limit}`)
            .then(response => response.text())
            .then(html => {
                const newDoc = new DOMParser().parseFromString(html, 'text/html');
                const newTableBody = newDoc.querySelector('tbody').innerHTML;
                document.querySelector('tbody').innerHTML = newTableBody;
                const totalPrograms = parseInt(newDoc.querySelector('#totalPrograms').value);
                const totalPages = Math.ceil(totalPrograms / limit);
                updatePaginationControls(page, totalPages);
                updateRowNumbers(page, limit);
                addEventListeners();
            })
            .catch(error => console.error('Error fetching items:', error));
    }

    function updatePaginationControls(page, totalPages) {
        currentPage = page;
        pageInfo.textContent = `Page ${page} of ${totalPages}`;
        prevButton.disabled = page <= 1;
        nextButton.disabled = page >= totalPages;
    }

    function updateRowNumbers(page, limit) {
        const rows = document.querySelectorAll('tbody tr');
        rows.forEach((row, index) => {
            row.querySelector('.program-index').textContent = (page - 1) * limit + index + 1;
        });
    }

    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            fetchItems(currentPage - 1);
        }
    });

    nextButton.addEventListener('click', () => {
        fetchItems(currentPage + 1);
    });

    // Initialize event listeners
    addEventListeners();
    fetchItems();
});

// CSV export functions
function downloadCSV(csv, filename) {
    let csvFile;
    let downloadLink;

    csvFile = new Blob([csv], {
        type: 'text/csv'
    });

    downloadLink = document.createElement('a');
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
}

function exportTableToCSV(filename) {
    const rows = document.querySelectorAll('.table-container table tr');
    let csv = [];
    for (let i = 0; i < rows.length; i++) {
        const row = [];
        const cols = rows[i].querySelectorAll('td, th');
        for (let j = 0; j < cols.length - 1; j++) { // Skip the last column
            const data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ');
            row.push('"' + data + '"');
        }
        csv.push(row.join(','));
    }
    downloadCSV(csv.join('\n'), filename);
}

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];

    if (file) {
        const fileType = file.name.split('.').pop().toLowerCase();
        const reader = new FileReader();

        if (fileType === 'csv') {
            reader.onload = function(e) {
                const content = e.target.result;
                parseAndSendCSVData(content);
            };
            reader.readAsText(file);
        } else if (fileType === 'xlsx') {
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });  // Get data as a 2D array
                parseAndSendXLSXData(json);
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert('Invalid file type. Please upload a CSV or XLSX file.');
        }
    }
});

function parseAndSendCSVData(csvContent) {
    const lines = csvContent.split('\n');
    const programData = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const fields = line.split(';');
            const program = {
                name: fields[0],
                recent_update_date: fields[1],
                creation_date: fields[2],
                program_type: fields[3],
                frequency: fields[4],
                assistance_type: fields[5]
            };
           programData.push(program);
        }
    }

    fetch('/programs/import', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ program: programData })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Data imported successfully!');
            window.location.reload();
        } else {
            alert('Import failed. Error: ' + data.message);
        }
    })
    .catch(error => console.error('Error importing data:', error));
}

function parseAndSendXLSXData(xlsxData) {
    const programData = [];

    // Assuming the first row (index 0) is the header, we start from the second row
    for (let i = 1; i < xlsxData.length; i++) {
        const row = xlsxData[i];
        if (row && row.length >= 6) {  // Ensure the row has at least 2 columns (name and type)
            const program = {
                name: row[0],
                recent_update_date: row[1],
                creation_date: row[2],
                program_type: row[3],
                frequency: row[4],
                assistance_type: row[5],
            };
           programData.push(program);
        }
    }

    fetch('/programs/import', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ program: programData })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Data imported successfully!');
            window.location.reload();
        } else {
            alert('Import failed. Error: ' + data.message);
        }
    })
    .catch(error => console.error('Error importing data:', error));
}

function toggleRowHighlight(checkbox) {
    const row = checkbox.closest('tr');
    if (checkbox.checked) {
        row.classList.add('selected');
    } else {
        row.classList.remove('selected');
    }
}

function deleteSelected() {
    // Collect all selected checkboxes
    const selectedCheckboxes = document.querySelectorAll('.select-checkbox:checked');

    // Collect the IDs of selected rows
    const idsToDelete = Array.from(selectedCheckboxes).map(checkbox =>
        checkbox.closest('tr').getAttribute('data-id')
    );

    if (idsToDelete.length === 0) {
        alert("No items selected.");
        return;
    }

    // Confirmation dialog
    if (!confirm(`Are you sure you want to delete ${idsToDelete.length} item(s)?`)) {
        return;
    }

    // Remove selected rows from the DOM
    selectedCheckboxes.forEach(checkbox => {
        const row = checkbox.closest('tr');
        row.remove();
    });

    // Send DELETE request to the server
    fetch('/programs/delete-multiple', {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: idsToDelete })
    })
        .then(response => {
            if (response.ok) {
                alert('Selected programs deleted successfully.');
            } else {
                alert('Failed to delete selected programs. Please try again.');
                console.error('Delete failed:', response.statusText);
            }
        })
        .catch(error => {
            console.error('Error deleting items:', error);
        });
}



document.addEventListener('DOMContentLoaded', function() {
    
    document.getElementById('searchInput').addEventListener('input', function () {
        const filter = this.value.toLowerCase();
        const rows = document.querySelectorAll('tbody tr');
    
        rows.forEach(row => {
            const programName = row.querySelector('td:nth-child(3)').textContent.toLowerCase();

            const searchText = `${programName}`;

            if (searchText.includes(filter)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
        addEventListeners();
    }
);

document.addEventListener("DOMContentLoaded", function () {
    function toggleRowHighlight(checkbox) {
        console.log('Checkbox toggled:', checkbox.checked); // Log checkbox state
        const row = checkbox.closest('tr'); // Select the parent row
        console.log('Parent row:', row); // Log the row being affected

        const actionContainer = document.getElementById('action-container');
        const checkboxes = document.querySelectorAll('.select-checkbox');
        const anyChecked = Array.from(checkboxes).some(cb => cb.checked); // Check if any box is selected

        if (checkbox.checked) {
            row.classList.add('highlighted-row'); // Highlight the row
        } else {
            row.classList.remove('highlighted-row'); // Remove the highlight
        }

        actionContainer.style.display = anyChecked ? 'block' : 'none'; // Toggle button visibility
    }

    // Attach this function to each checkbox
    document.querySelectorAll('.select-checkbox').forEach((checkbox) => {
        checkbox.addEventListener('change', function () {
            toggleRowHighlight(this);
        });
    });
});





