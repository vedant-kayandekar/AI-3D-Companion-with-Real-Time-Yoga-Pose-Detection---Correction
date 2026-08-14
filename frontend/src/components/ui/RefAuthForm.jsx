import React from 'react';
import styled from 'styled-components';

const RefAuthForm = ({
  isRegister,
  setIsRegister,
  formData,
  handleChange,
  handleSubmit,
  error,
  isSubmitting
}) => {
  return (
    <StyledWrapper>
      <form className="form" onSubmit={handleSubmit}>
        <p id="heading">{isRegister ? "Create Account" : "Login"}</p>
        
        <div className="field">
          <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="currentColor" viewBox="0 0 16 16">
            <path d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914z" />
          </svg>
          <input 
            autoComplete="off" 
            placeholder="Username" 
            className="input-field" 
            type="text" 
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="field">
          <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
          </svg>
          <input 
            placeholder="Password" 
            className="input-field" 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="btn">
          <button type="submit" disabled={isSubmitting} className="button1">
            {isSubmitting ? "..." : (isRegister ? "Sign Up" : "Login")}
          </button>
          <button type="button" className="button2" onClick={() => { setIsRegister(!isRegister); handleChange({target:{name:'username', value:formData.username}}); /* clear error logic is in App.jsx */ }}>
            {isRegister ? "Switch to Login" : "Create Account"}
          </button>
        </div>
        
        {!isRegister && <button type="button" className="button3">Forgot Password?</button>}
      </form>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-left: 2em;
    padding-right: 2em;
    padding-bottom: 0.4em;
    background-color: #2d4431; /* Dark Sage instead of #171717 */
    border-radius: 25px;
    transition: .4s ease-in-out;
    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
  }

  .form:hover {
    transform: scale(1.02);
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  }

  #heading {
    text-align: center;
    margin: 1.5em;
    color: rgb(255, 255, 255);
    font-size: 1.4em;
    font-family: "Playfair Display", serif;
  }

  .field {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    border-radius: 25px;
    padding: 0.8em;
    border: none;
    outline: none;
    color: white;
    background-color: #1a2b1f; /* Darker Sage */
    box-shadow: inset 2px 5px 10px rgba(0,0,0,0.3);
  }

  .input-icon {
    height: 1.3em;
    width: 1.3em;
    fill: #9b8ec4; /* Lavender */
  }

  .input-field {
    background: none;
    border: none;
    outline: none;
    width: 100%;
    color: #fdf8f3; /* Warm BG */
    font-family: "Nunito", sans-serif;
  }
  
  .input-field::placeholder {
    color: #6b8f71; /* Sage */
  }

  .error-message {
    color: #e07a5f; /* Coral */
    font-size: 0.85em;
    text-align: center;
    margin-top: 5px;
  }

  .form .btn {
    display: flex;
    justify-content: center;
    flex-direction: row;
    gap: 10px;
    margin-top: 1.5em;
  }

  .button1 {
    flex: 1;
    padding: 0.8em;
    border-radius: 12px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;
    background-color: #6b8f71; /* Sage */
    color: white;
    font-weight: bold;
    cursor: pointer;
  }

  .button1:hover:not(:disabled) {
    background-color: #9b8ec4; /* Lavender */
    transform: translateY(-2px);
  }
  
  .button1:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .button2 {
    flex: 1;
    padding: 0.8em;
    border-radius: 12px;
    border: 2px solid #6b8f71;
    outline: none;
    transition: .4s ease-in-out;
    background-color: transparent;
    color: #fdf8f3;
    font-weight: bold;
    cursor: pointer;
  }

  .button2:hover {
    background-color: rgba(107, 143, 113, 0.2);
    color: white;
  }

  .button3 {
    margin-top: 1em;
    margin-bottom: 2em;
    padding: 0.5em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;
    background-color: transparent;
    color: rgba(255,255,255,0.5);
    font-size: 0.9em;
    cursor: pointer;
  }

  .button3:hover {
    color: #e07a5f; /* Coral */
  }
`;

export default RefAuthForm;
