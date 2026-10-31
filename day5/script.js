const loadUsersBtn = document.querySelector('#load-users');
const filterInput = document.querySelector('#filter-input');
const statusMsg = document.querySelector('#status');
const usersList = document.querySelector('#users-list');

let usersData = [];

async function loadUsers() {
    loadUsersBtn.disabled = true;
    statusMsg.textContent = "Loading users...";
    usersList.textContent = '';
    filterInput.value = '';

    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        usersData = await response.json();
        renderUsers(usersData);
        statusMsg.textContent = "Users loaded successfully!";
    } catch (error) {
        console.error('Fetch error:', error);
        statusMsg.textContent = "Error loading users. Please try again later.";
    } finally {
        loadUsersBtn.disabled = false;
    }
}

function renderUsers(list) {
    usersList.textContent = '';

    if (list.length === 0) {
        const noMatchItem = document.createElement('li');
        noMatchItem.textContent = "No users match your filter.";
        usersList.appendChild(noMatchItem);
        return;
    }

    list.forEach(user => {
        const li = document.createElement('li');
        
        const nameEl = document.createElement('strong');
        nameEl.textContent = user.name;
        
        const detailsEl = document.createElement('span');
        detailsEl.textContent = ` | Email: ${user.email} | City: ${user.address.city} | Company: ${user.company.name}`;
        
        li.appendChild(nameEl);
        li.appendChild(detailsEl);
        usersList.appendChild(li);
    });
}

loadUsersBtn.addEventListener('click', loadUsers);

filterInput.addEventListener('input', (e) => {
    const searchText = e.target.value.toLowerCase();
    
    const filteredUsers = usersData.filter(user => 
        user.name.toLowerCase().includes(searchText)
    );
    
    renderUsers(filteredUsers);
});