const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginButton");

const errorText =
    document.getElementById("error");

// 엔터 입력으로도 로그인
passwordInput.addEventListener("keydown", function (e) {

    if (e.key === "Enter") {
        login();
    }

});

loginButton.addEventListener("click", login);

async function login() {

    errorText.innerText = "";

    const password =
        passwordInput.value.trim();

    if (password === "") {

        errorText.innerText =
            "비밀번호를 입력해주세요.";

        return;
    }

    try {

        const response =
            await fetch(CONFIG.API_BASE + "/api/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    password: password

                })

            });

        if (!response.ok) {

            errorText.innerText =
                "비밀번호가 올바르지 않습니다.";

            return;
        }

        const result =
            await response.json();

        // 토큰 저장
        localStorage.setItem(
            "token",
            result.token);

        // 객실 화면으로 이동
        location.href =
            "rooms.html";

    }
    catch (e) {

        console.error(e);

        errorText.innerText =
            "서버에 연결할 수 없습니다.";

    }

}