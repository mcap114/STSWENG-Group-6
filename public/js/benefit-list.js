function formatDate(date) {
    let d = new Date(date);
    let fullMonth = d.getMonth() < 10 ? "0" + d.getMonth() : d.getMonth();
    let fullDate = d.getDate() < 10 ? "0" + d.getDate() : d.getDate();
    return d.getFullYear() + '-' + fullMonth + '-' + fullDate;
}

function setSelectedValue(selectObj, valueToSet) {
    for (let i = 0; i < selectObj.options.length; i++) {
        if (selectObj.options[i].text === valueToSet) {
            selectObj.options[i].selected = true;
            return;
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("menu-toggle").addEventListener("click", function() {
        document.getElementById("wrapper").classList.toggle("toggled");
        document.querySelector(".main-content").classList.toggle("toggled");
        document.querySelector(".header-right").classList.toggle("toggled");
    });

    const newMemberAddBtn = document.querySelector('.createBtn button'),
        darkBg = document.querySelector('.dark_bg'),
        popupForm = document.querySelector('.popup'),
        crossBtn = document.querySelector('.closeBtn'),
        submitBtn = document.querySelector('.submitBtn'),
        modalTitle = document.querySelector('.modalTitle'),
        form = document.querySelector('#createBenefitForm'),
        formInputFields = document.querySelectorAll('#createBenefitForm input, #createBenefitForm select');

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

    // Add event listeners to filter elements
    document.querySelectorAll('input[name="nameSort"]').forEach(input => {
        input.addEventListener('change', applyFiltersAndSort);
    });
    document.querySelectorAll('input[name="quantitySort"]').forEach(input => {
        input.addEventListener('change', applyFiltersAndSort);
    });
    document.querySelectorAll('input[name="dateSort"]').forEach(input => {
        input.addEventListener('change', applyFiltersAndSort);
    });
    document.querySelectorAll('input[name="benefactorFilter"]').forEach(input => {
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
        const benefit = {
            id: Date.now(),
            benefitName: form.benefitName.value,
            benefitDesc: form.benefitDesc.value,
            quantity: form.quantity.value,
            dateReceived: form.dateReceived.value,
            benefactor: form.benefactor.value
        };

        if (!isEdit) {
            originalData.push(benefit);
        } else {
            originalData[editId] = benefit;
        }

        $.post("/benefits/create", benefit, (data, status, xhr) => {
            if (status === "success" && xhr.status === 201) {
                alert("Benefits has been created.");
                location.reload();
            }
        });

        localStorage.setItem('benefits', JSON.stringify(originalData));
        getData = [...originalData];

        location.reload();
        darkBg.classList.remove('active');
        popupForm.classList.remove('active');
        form.reset();
    });

    document.getElementById("editBenefitForm").addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission
        let benefit_id = document.getElementById("editBenefitId").value;
        let benefit_name = document.getElementById("editBenefitName").value;
        let benefit_desc = document.getElementById("editBenefitDesc").value;
        let benefit_quantity = document.getElementById("editQuantity").value;
        let benefit_date_received = document.getElementById("editDateReceived").value;
        let benefit_benefactor = document.getElementById("editBenefactor").value;

        let benefit = {
            id: benefit_id,
            name: benefit_name,
            description: benefit_desc,
            quantity: benefit_quantity,
            date_received: benefit_date_received,
            benefactor: benefit_benefactor
        };

        $.post("/benefits/edit", benefit, (data, status, xhr) => {
            if (status === "success" && xhr.status === 200) {
                let modalInstance = bootstrap.Modal.getInstance(document.getElementById("modal-benefit-edit"));
                modalInstance.hide();
                alert("Update benefit successfully.");
                location.reload();
            } else {
                alert("Error updating benefit");
            }
        }).fail(() => {
            alert("Error updating benefit");
        });
    });

    // Edit and delete event handlers
    function addEventListeners() {
        document.querySelectorAll('.editBtn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.closest("tr").getAttribute('data-benefit-id');
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
        let benefit_id = e.currentTarget.closest("tr").getAttribute("data-benefit-id");
        let benefit_name = e.currentTarget.closest("tr").querySelector("td:nth-child(2)").textContent;
        let benefit_desc = e.currentTarget.closest("tr").querySelector("td:nth-child(3)").textContent;
        let benefit_quantity = e.currentTarget.closest("tr").querySelector("td:nth-child(4)").textContent;
        let benefit_date_received = e.currentTarget.closest("tr").querySelector("td:nth-child(5)").textContent;
        let benefit_benefactor = e.currentTarget.closest("tr").querySelector("td:nth-child(6)").textContent;

        let modal_edit = document.getElementById("modal-benefit-edit");
        let modal_edit_id = modal_edit.querySelector("#editBenefitId");
        let modal_edit_name = modal_edit.querySelector("#editBenefitName");
        let modal_edit_desc = modal_edit.querySelector("#editBenefitDesc");
        let modal_edit_quantity = modal_edit.querySelector("#editQuantity");
        let modal_edit_date_received = modal_edit.querySelector("#editDateReceived");
        let modal_edit_benefactor = modal_edit.querySelector("#editBenefactor");

        modal_edit_id.value = benefit_id;
        modal_edit_name.value = benefit_name;
        modal_edit_desc.value = benefit_desc;
        modal_edit_quantity.value = benefit_quantity;
        modal_edit_date_received.value = formatDate(benefit_date_received);
        setSelectedValue(modal_edit_benefactor, benefit_benefactor);
    }

    function editInfo(id, e) {
        onBtnEditClick(e);
        isEdit = true;
        editId = getData.findIndex(item => item.id === id);
        const benefit = getData[editId];
        if (benefit) {
            form.benefitName.value = benefit.benefitName;
            form.benefitDesc.value = benefit.benefitDesc;
            form.quantity.value = benefit.quantity;
            form.dateReceived.value = benefit.dateReceived;
            form.benefactor.value = benefit.benefactor;
            modalTitle.innerHTML = "Edit Benefit";
            formInputFields.forEach(input => input.disabled = false);
            submitBtn.style.display = "block";
            submitBtn.innerHTML = "Update";
            darkBg.classList.add('active');
            popupForm.classList.add('active');
        }
    }

    function deleteInfo(id, e) {
        if (confirm("Are you sure you want to delete this benefit?")) {
            originalData = originalData.filter(item => item.id !== id);
            localStorage.setItem('benefits', JSON.stringify(originalData));

            $.post(`/benefits/delete`, { benefit_id: id })
                .done((data, status, xhr) => {
                    if (status === "success" && xhr.status === 200) {
                        alert("Benefit has been deleted");
                        location.reload();
                    } else {
                        alert("Failed to delete benefit. Please try again.");
                    }
                })
                .fail((xhr, status, error) => {
                    alert("Error deleting benefit. Please try again later.");
                    console.error(error);
                });
        }
    }

    // Filter and sort function
    function applyFiltersAndSort() {
        const nameSort = $('input[name="nameSort"]:checked').val();
        const quantitySort = $('input[name="quantitySort"]:checked').val();
        const dateSort = $('input[name="dateSort"]:checked').val();
        const benefactorFilter = $('input[name="benefactorFilter"]:checked').map(function() { return this.value; }).get();

        let query = [];

        if (nameSort) query.push(`nameSort=${nameSort}`);
        if (quantitySort) query.push(`quantitySort=${quantitySort}`);
        if (dateSort) query.push(`dateSort=${dateSort}`);
        if (benefactorFilter.length) query.push(`benefactorFilter=${benefactorFilter.join(',')}`);

        const queryString = query.length > 0 ? `?${query.join('&')}` : '';

        fetch(`/benefits${queryString}`)
            .then(response => response.text())
            .then(html => {
                const newDoc = new DOMParser().parseFromString(html, 'text/html');
                const newTableBody = newDoc.querySelector('tbody').innerHTML;
                document.querySelector('tbody').innerHTML = newTableBody;
                addEventListeners();
            })
            .catch(error => console.error('Error fetching filtered data:', error));
    }

    function fetchItems(page = 1) {
        fetch(`/benefits?page=${page}&limit=${limit}`)
            .then(response => response.text())
            .then(html => {
                const newDoc = new DOMParser().parseFromString(html, 'text/html');
                const newTableBody = newDoc.querySelector('tbody').innerHTML;
                document.querySelector('tbody').innerHTML = newTableBody;
                const totalPeople = parseInt(newDoc.querySelector('#totalBenefits').value);
                const totalPages = Math.ceil(totalPeople / limit);
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
            row.querySelector('.benefit-index').textContent = (page - 1) * limit + index + 1;
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
    const benefitData = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const fields = line.split(';');
            const benefit = {
                name: fields[0],
                description: fields[1],
                quantity: fields[2],
                date_received: fields[3],
                benefactor: fields[4]
            };
           benefitData.push(benefit);
        }
    }

    fetch('/benefits/import', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ benefit: benefitData })
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
    const benefitData = [];

    // Assuming the first row (index 0) is the header, we start from the second row
    for (let i = 1; i < xlsxData.length; i++) {
        const row = xlsxData[i];
        if (row && row.length >= 5) {  // Ensure the row has at least 5 columns 
            const benefit = {
                name: row[0],
                description: row[1],
                quantity: row[2],
                date_received: row[3],
                benefactor: row[4]
            };
            benefitData.push(benefit);
        }
    }

    fetch('/benefits/import', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ benefit: benefitData })
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
