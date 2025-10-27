const API_URL = "http://localhost:3000";

// Função para exibir notificações toast
function showToast(message, type = "error") {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    console.error("Contêiner de toast não encontrado.");
    return;
  }
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Função para mostrar o popup do reCAPTCHA
function showRecaptchaModal() {
  const modal = document.getElementById("recaptchaModal");
  const recaptchaContainer = document.getElementById("recaptchaContainer");
  if (!modal || !recaptchaContainer) {
    console.error("Modal ou recaptchaContainer não encontrado.");
    return;
  }
  recaptchaContainer.innerHTML = ""; // Limpa o contêiner
  modal.classList.add("active"); // Adiciona classe active para exibir o modal

  // Verifica se o grecaptcha está carregado
  if (
    typeof grecaptcha !== "undefined" &&
    !recaptchaContainer.dataset.rendered
  ) {
    grecaptcha.render("recaptchaContainer", {
      sitekey: "6LcIb30rAAAAABSsBm5gWIXrEN-AOpITdwnTv-g0", // Sua chave de site
      callback: verifyCallback, // Callback chamado após verificação do reCAPTCHA
    });
    recaptchaContainer.dataset.rendered = "true";
  } else if (!recaptchaContainer.dataset.rendered) {
    // Aguarda o carregamento do script do reCAPTCHA
    const waitForGrecaptcha = setInterval(() => {
      if (typeof grecaptcha !== "undefined") {
        clearInterval(waitForGrecaptcha);
        grecaptcha.render("recaptchaContainer", {
          sitekey: "6LcIb30rAAAAABSsBm5gWIXrEN-AOpITdwnTv-g0",
          callback: verifyCallback,
        });
        recaptchaContainer.dataset.rendered = "true";
      }
    }, 100);
  }
}

// Função para fechar o popup
function closeRecaptchaModal() {
  const modal = document.getElementById("recaptchaModal");
  const recaptchaContainer = document.getElementById("recaptchaContainer");
  if (modal && recaptchaContainer) {
    modal.classList.remove("active"); // Remove classe active para ocultar o modal
    recaptchaContainer.innerHTML = ""; // Limpa o contêiner
    recaptchaContainer.dataset.rendered = ""; // Permite nova renderização
  }
}

// Callback do reCAPTCHA para enviar a requisição de login
function verifyCallback(recaptchaToken) {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const rememberMe = document.getElementById("rememberMe").checked;
  const recaptchaError = document.getElementById("recaptchaModalError");

  recaptchaError.textContent = "";

  fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, recaptchaToken }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw new Error(err.message);
        });
      }
      return response.json();
    })
    .then((data) => {
      closeRecaptchaModal(); // Fecha o popup
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("username", data.username);
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      showToast("Login realizado com sucesso!", "success");
      setTimeout(() => {
        if (data.role === "admin") {
          window.location.href = "../html/adminPerfil.html";
        } else {
          window.location.href = "../html/Catalogo.html";
        }
      }, 2000);
    })
    .catch((error) => {
      console.error("Erro ao fazer login:", error);
      recaptchaError.textContent =
        error.message || "Erro ao fazer login. Verifique suas credenciais.";
      grecaptcha.reset(); // Reseta o reCAPTCHA após erro
    });
}

// Função para detectar padrões sequenciais na senha
function hasSequentialPatterns(password) {
  // Sequências numéricas
  const sequences = [
    "012345",
    "123456",
    "234567",
    "345678",
    "456789",
    "567890",
    "abcdef",
    "bcdefg",
    "cdefgh",
    "defghi",
    "efghij",
    "fghijk",
    "ghijkl",
    "hijklm",
    "ijklmn",
    "jklmno",
    "klmnop",
    "lmnopq",
    "mnopqr",
    "nopqrs",
    "opqrst",
    "pqrstu",
    "qrstuv",
    "rstuvw",
    "stuvwx",
    "tuvwxy",
    "uvwxyz",
  ];
  const lower = password.toLowerCase();
  for (let seq of sequences) {
    if (lower.includes(seq)) return true;
  }
  return false;
}

// Função para validar senha e retornar critérios não atendidos
function getPasswordCriteria(password) {
  const criteria = [
    { test: (pw) => pw.length >= 8, label: "Pelo menos 8 caracteres" },
    { test: (pw) => /[A-Z]/.test(pw), label: "Uma letra maiúscula" },
    { test: (pw) => /[a-z]/.test(pw), label: "Uma letra minúscula" },
    { test: (pw) => /[0-9]/.test(pw), label: "Um número" },
    {
      test: (pw) => /[!@#$%^&*]/.test(pw),
      label: "Um caractere especial (!@#$%^&*)",
    },
    {
      test: (pw) => !hasSequentialPatterns(pw),
      label: "Não ser sequencial (ex: 123456 ou abcdef)",
    },
  ];
  return criteria.map((c) => ({ label: c.label, valid: c.test(password) }));
}

// Exibe critérios de senha dinamicamente
function showPasswordCriteriaDynamic(password) {
  const criteriaBox = document.getElementById("passwordCriteriaBox");
  if (!criteriaBox) return;
  const criteria = getPasswordCriteria(password);
  criteriaBox.innerHTML = criteria
    .map(
      (c) => `<li style="color:${c.valid ? "green" : "red"}">${c.label}</li>`
    )
    .join("");
}

// Password strength calculation function
function calculatePasswordStrength(password) {
  let score = 0;
  // Critérios básicos
  if (password.length >= 8) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[!@#$%^&*]/.test(password)) score += 10;
  if (!hasSequentialPatterns(password)) score += 10;

  let strength = "weak";
  let message = "Senha fraca";

  if (score >= 90) {
    strength = "strong";
    message = "Senha forte";
  } else if (score >= 70) {
    strength = "good";
    message = "Senha boa";
  } else if (score >= 50) {
    strength = "fair";
    message = "Senha razoável";
  } else if (score > 0) {
    strength = "weak";
    message = "Senha fraca";
  } else {
    message = "Digite uma senha";
  }

  return { strength, message, score };
}

// Update password strength indicator
function updatePasswordStrength(passwordId, strengthFillId, strengthTextId) {
  const password = document.getElementById(passwordId).value;
  const strengthFill = document.getElementById(strengthFillId);
  const strengthText = document.getElementById(strengthTextId);

  if (!strengthFill || !strengthText) return;

  const result = calculatePasswordStrength(password);

  // Remove all strength classes
  strengthFill.classList.remove("weak", "fair", "good", "strong");
  strengthText.classList.remove("weak", "fair", "good", "strong");

  if (password.length > 0) {
    // Add current strength class
    strengthFill.classList.add(result.strength);
    strengthText.classList.add(result.strength);
  }

  strengthText.textContent = result.message;
}

// Update password match indicator
function updatePasswordMatch() {
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;
  const matchText = document.getElementById("regConfirmPasswordMatchText");

  if (!matchText) return;

  // Remove all match classes
  matchText.classList.remove("match", "no-match");

  if (confirmPassword.length > 0) {
    if (password === confirmPassword) {
      matchText.classList.add("match");
      matchText.textContent = "As senhas coincidem";
    } else {
      matchText.classList.add("no-match");
      matchText.textContent = "As senhas não coincidem";
    }
  } else {
    matchText.textContent = "";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Verifica se há um token válido no localStorage para restaurar a sessão
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (token) {
    try {
      const response = await fetch(`${API_URL}/api/verificar-admin`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        showToast("Sessão restaurada com sucesso!", "success");
        setTimeout(() => {
          if (role === "admin") {
            window.location.href = "../html/adminPerfil.html";
          } else {
            window.location.href = "../html/Catalogo.html";
          }
        }, 2000);
      } else {
        // Remove dados do localStorage se o token for inválido
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user_id");
        localStorage.removeItem("username");
      }
    } catch (error) {
      console.error("Erro ao verificar token:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user_id");
      localStorage.removeItem("username");
    }
  }

  // Garante que o modal esteja oculto na inicialização
  const modal = document.getElementById("recaptchaModal");
  if (modal) {
    modal.classList.remove("active");
  }

  document
    .querySelector(".box-login form")
    .addEventListener("submit", validateLogin);
  document
    .querySelector(".box-register form")
    .addEventListener("submit", validateRegistration);
  // Adiciona evento para o botão de fechar o popup
  const closeButton = document.querySelector(".modal .close");
  if (closeButton) {
    closeButton.addEventListener("click", closeRecaptchaModal);
  } else {
    console.error("Botão de fechar do modal não encontrado.");
  }
  loadRememberedCredentials();

  // Add password strength and criteria event listeners
  const regPasswordInput = document.getElementById("regPassword");
  const regConfirmPasswordInput = document.getElementById("regConfirmPassword");

  if (regPasswordInput) {
    regPasswordInput.addEventListener("input", () => {
      updatePasswordStrength(
        "regPassword",
        "regPasswordStrengthFill",
        "regPasswordStrengthText"
      );
      updatePasswordMatch();
      showPasswordCriteriaDynamic(regPasswordInput.value); // Mostra critérios em tempo real
    });
    // Exibe popup de critérios ao focar
    regPasswordInput.addEventListener("focus", () => {
      const criteriaBox = document.getElementById("passwordCriteriaBox");
      if (criteriaBox) criteriaBox.style.display = "block";
    });
    // Esconde popup de critérios ao desfocar
    regPasswordInput.addEventListener("blur", () => {
      const criteriaBox = document.getElementById("passwordCriteriaBox");
      if (criteriaBox) criteriaBox.style.display = "none";
    });
  }

  if (regConfirmPasswordInput) {
    regConfirmPasswordInput.addEventListener("input", updatePasswordMatch);
  }
});

function myLogPassword() {
  const passwordInput = document.getElementById("loginPassword");
  const eye = document.getElementById("eye");
  const eyeSlash = document.getElementById("eye-slash");
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eye.style.opacity = "0";
    eyeSlash.style.opacity = "1";
  } else {
    passwordInput.type = "password";
    eye.style.opacity = "1";
    eyeSlash.style.opacity = "0";
  }
}

function myRegPassword() {
  const passwordInput = document.getElementById("regPassword");
  const eye = document.getElementById("eye-2");
  const eyeSlash = document.getElementById("eye-slash-2");
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eye.style.opacity = "0";
    eyeSlash.style.opacity = "1";
  } else {
    passwordInput.type = "password";
    eye.style.opacity = "1";
    eyeSlash.style.opacity = "0";
  }
}

function myRegConfirmPassword() {
  const passwordInput = document.getElementById("regConfirmPassword");
  const eye = document.getElementById("eye-3");
  const eyeSlash = document.getElementById("eye-slash-3");
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eye.style.opacity = "0";
    eyeSlash.style.opacity = "1";
  } else {
    passwordInput.type = "password";
    eye.style.opacity = "1";
    eyeSlash.style.opacity = "0";
  }
}

function loadRememberedCredentials() {
  const rememberedEmail = localStorage.getItem("rememberedEmail");
  const rememberMeCheckbox = document.getElementById("rememberMe");

  if (rememberedEmail) {
    document.getElementById("loginEmail").value = rememberedEmail;
    rememberMeCheckbox.checked = true;
  }
}

// Função única para validar senha (reutilizável)
function validatePassword(password) {
  if (!password) return "Por favor, insira uma senha.";
  if (password.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  if (!/[A-Z]/.test(password))
    return "A senha deve conter pelo menos uma letra maiúscula.";
  if (!/[a-z]/.test(password))
    return "A senha deve conter pelo menos uma letra minúscula.";
  if (!/[0-9]/.test(password))
    return "A senha deve conter pelo menos um número.";
  if (!/[!@#$%^&*]/.test(password))
    return "A senha deve conter pelo menos um caractere especial (!@#$%^&*).";
  if (hasSequentialPatterns(password))
    return "A senha não deve conter sequências como '123456' ou 'abcdef'.";
  return "";
}

function validateLogin(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const emailError = document.getElementById("loginEmailError");
  const passwordError = document.getElementById("loginPasswordError");
  const recaptchaError = document.getElementById("recaptchaModalError");

  emailError.textContent = "";
  passwordError.textContent = "";
  recaptchaError.textContent = "";

  if (!email) {
    emailError.textContent = "Por favor, insira um email.";
    return;
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    emailError.textContent = "Por favor, insira um email válido.";
    return;
  }
  const passwordValidation = validatePassword(password);
  if (passwordValidation) {
    passwordError.textContent = passwordValidation;
    return;
  }

  // Exibe o popup do reCAPTCHA
  showRecaptchaModal();
}

function validateRegistration(event) {
  event.preventDefault();

  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;
  const usernameError = document.getElementById("regUsernameError");
  const emailError = document.getElementById("regEmailError");
  const passwordError = document.getElementById("regPasswordError");
  const confirmPasswordError = document.getElementById(
    "regConfirmPasswordError"
  );

  usernameError.textContent = "";
  emailError.textContent = "";
  passwordError.textContent = "";
  confirmPasswordError.textContent = "";

  if (!username) {
    usernameError.textContent = "Por favor, insira um nome de usuário.";
    return;
  }
  if (username.length < 3) {
    usernameError.textContent =
      "O nome de usuário deve ter pelo menos 3 caracteres.";
    return;
  }
  if (!email) {
    emailError.textContent = "Por favor, insira um email.";
    return;
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    emailError.textContent = "Por favor, insira um email válido.";
    return;
  }
  const passwordValidation = validatePassword(password);
  if (passwordValidation) {
    passwordError.textContent = passwordValidation;
    return;
  }
  if (password !== confirmPassword) {
    confirmPasswordError.textContent = "As senhas não coincidem.";
    return;
  }

  fetch(`${API_URL}/api/registro`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw new Error(err.message);
        });
      }
      return response.json();
    })
    .then(() => {
      showToast(
        "Cadastro realizado com sucesso! Faça login para continuar.",
        "success"
      );
      login();
    })
    .catch((error) => {
      console.error("Erro ao cadastrar:", error);
      emailError.textContent =
        error.message || "Erro ao cadastrar. Tente novamente.";
    });
}

function login() {
  document.querySelector(".box-login").style.left = "27px";
  document.querySelector(".box-register").style.right = "-350px";
  document.querySelector(".btn-active").style.left = "0px";
  document.querySelector(".login").classList.add("active");
  document.querySelector(".register").classList.remove("active");
  closeRecaptchaModal(); // Fecha o popup ao mudar para login
}

function register() {
  document.querySelector(".box-login").style.left = "-350px";
  document.querySelector(".box-register").style.right = "25px";
  document.querySelector(".btn-active").style.left = "175px";
  document.querySelector(".login").classList.remove("active");
  document.querySelector(".register").classList.add("active");
  closeRecaptchaModal(); // Fecha o popup ao mudar para cadastro
}
