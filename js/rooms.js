let previousRoomsJson = "";

let lastRooms = [];

let currentTab = "all";

const token =
    localStorage.getItem("token");

const refreshButton =
    document.getElementById("refreshButton");

const tabButtons =
    document.querySelectorAll(".tab-button");

const roomsContainer =
    document.getElementById("roomsContainer");

refreshButton.addEventListener("click", () => {
    loadRooms(true);
});

tabButtons.forEach(button => {

    button.addEventListener("click", () => {

        document
            .querySelector(".tab-button.active")
            ?.classList.remove("active");

        button.classList.add("active");

        currentTab =
            button.dataset.filter;

        renderRooms(lastRooms);

    });

});

loadRooms(true);

setInterval(
    loadRooms,
    CONFIG.REFRESH_INTERVAL ?? 3000);

async function loadRooms(forceRender = false) {

    if (!token) {
        location.href = "index.html";
        return;
    }

    try {

        const response =
            await fetch(
                CONFIG.API_BASE + "/api/rooms",
                {
                    headers: {
                        Authorization:
                            "Bearer " + token
                    }
                });

        if (response.status === 401) {
            localStorage.removeItem("token");
            location.href = "index.html";
            return;
        }

        if (!response.ok) {
            console.error("객실 정보를 불러오지 못했습니다.");
            return;
        }

        const rooms =
            await response.json();

        const currentJson =
            JSON.stringify(rooms);

        if (!forceRender &&
            currentJson === previousRoomsJson) {
            return;
        }

        previousRoomsJson =
            currentJson;

        lastRooms =
            rooms;

        renderRooms(rooms);

    }
    catch (e) {

        console.error(e);

    }

}

function renderRooms(rooms) {

    updateSummary(rooms);
    updateTime();

    roomsContainer.innerHTML = "";

    const filteredRooms =
        filterRooms(rooms);

    if (filteredRooms.length === 0) {

        roomsContainer.innerHTML =
            `<div class="empty-message">표시할 객실이 없습니다.</div>`;

        return;
    }

    const floors =
        groupByFloor(filteredRooms);

    Object.keys(floors)
        .sort((a, b) => Number(a) - Number(b))
        .forEach(floor => {

            const title =
                document.createElement("h2");

            title.innerText =
                floor + "층";

            roomsContainer.appendChild(title);

            const grid =
                document.createElement("div");

            grid.className =
                "floor-grid";

            floors[floor]
                .sort((a, b) => a.RoomNumber - b.RoomNumber)
                .forEach(room => {

                    grid.appendChild(
                        createRoomCard(room));

                });

            roomsContainer.appendChild(grid);

        });

}

function createRoomCard(room) {

    const stateInfo =
        getStateInfo(room.State);

    const card =
        document.createElement("div");

    card.className =
        "room-card " + stateInfo.className;

    card.innerHTML =
    `
        <h3>${room.RoomNumber}호</h3>

        <span class="status ${stateInfo.className}">
            ${stateInfo.icon} ${stateInfo.label}
        </span>

        <div class="room-time">
            ${formatTime(room.UpdatedAt)}
        </div>
    `;

    return card;

}

function filterRooms(rooms) {

    if (currentTab === "WaitCleaning") {

        return rooms.filter(room =>
            room.State === "WaitCleaning");

    }

    if (currentTab === "recent") {

        return [...rooms]
            .sort((a, b) =>
                new Date(b.UpdatedAt) -
                new Date(a.UpdatedAt))
            .slice(0, 10);

    }

    return rooms;

}

function groupByFloor(rooms) {

    const floors = {};

    rooms.forEach(room => {

        const floor =
            Math.floor(room.RoomNumber / 100);

        if (!floors[floor]) {
            floors[floor] = [];
        }

        floors[floor].push(room);

    });

    return floors;

}

function updateSummary(rooms) {

    setCount("emptyCount", rooms, "Empty");
    setCount("stayCount", rooms, "Stay");
    setCount("rentalCount", rooms, "Rental");
    setCount("longStayCount", rooms, "LongStay");
    setCount("outCount", rooms, "Out");
    setCount("cleaningCount", rooms, "Cleaning");
    setCount("waitCount", rooms, "WaitCleaning");

}

function setCount(elementId, rooms, state) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.innerText =
        rooms.filter(room =>
            room.State === state).length;

}

function updateTime() {

    document
        .getElementById("updateTime")
        .innerText =
        "마지막 갱신 " +
        new Date().toLocaleTimeString();

}

function getStateInfo(state) {

    switch (state) {

        case "Empty":
            return {
                className: "empty",
                icon: "⚪",
                label: "빈방"
            };

        case "Stay":
            return {
                className: "stay",
                icon: "🟠",
                label: "숙박"
            };

        case "Rental":
            return {
                className: "rental",
                icon: "🔵",
                label: "대실"
            };

        case "LongStay":
            return {
                className: "longstay",
                icon: "🟣",
                label: "장기"
            };

        case "Out":
            return {
                className: "out",
                icon: "🟢",
                label: "외출"
            };

        case "Cleaning":
            return {
                className: "cleaning",
                icon: "🔷",
                label: "청소중"
            };

        case "WaitCleaning":
            return {
                className: "waitcleaning",
                icon: "🟡",
                label: "청소대기"
            };

        case "Unknown":
        default:
            return {
                className: "unknown",
                icon: "⚫",
                label: "미확인"
            };

    }

}

function formatTime(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleTimeString(
        "ko-KR",
        {
            hour: "2-digit",
            minute: "2-digit"
        });

}