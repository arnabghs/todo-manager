const form = {
  loginForm: `<header class="login-header">My Todo App</header>
  <section class="login-section">
    <div class="image"></div>
    <div class="login-box-container">
      <div class="login-box">
        <div class="form-title">LOGIN</div>
        <form class="form" method="POST" action="/">
          <input type="text" placeholder="username" name="name" />
          <input type="password" placeholder="password" name="password" />
          <button>Login</button>
        </form>
        <div class="signUp-link">
        <a href="/signup">Create Account</a>
        </div>
      </div>
    </div>
  </section>`,

  signUpForm: `<header class="login-header">My Todo App</header>
  <section class="login-section">
    <div class="image"></div>
    <div class="login-box-container">
      <div class="login-box">
        <div class="form-title">SIGN UP</div>
        <form class="form" method="POST" action="/signup">
          <input type="text" placeholder="name" name="name" />
          <input type="text" placeholder="username" name="username" />
          <input type="password" placeholder="password" name="password" />
          <input type="password" placeholder="confirm password" name="confirm password" />
          <button>Sign Up</button>
        </form>
        <div class="login-link">
        <a href="/">Already have an account?</a>
        </div>
      </div>
    </div>
  </section>`
};

module.exports = form;
