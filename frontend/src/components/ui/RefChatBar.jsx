import React, { useRef, useState, useCallback } from 'react';
import styled from 'styled-components';

const RefChatBar = ({ onSend, loading, isListening, toggleListening }) => {
  const inputRef = useRef();

  const handleSend = () => {
    const text = inputRef.current?.value?.trim();
    if (!text || loading) return;
    onSend(text);
    inputRef.current.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <StyledWrapper>
      <div className="container_chat_bot">
        <div className="container-chat-options">
          <div className="chat">
            <div className="chat-bot">
              <textarea
                ref={inputRef}
                id="chat_bot"
                name="chat_bot"
                placeholder="Ask your AI tutor...✦˚"
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
            </div>
            <div className="options">
              <div className="btns-add">
                <button onClick={toggleListening} className={isListening ? 'listening' : ''}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-14 0m14 0a7 7 0 00-14 0m14 0v1a7 7 0 01-14 0v-1m7 8v4m-4 0h8"></path>
                  </svg>
                </button>
              </div>
              <button className="btn-submit" onClick={handleSend} disabled={loading}>
                <i>
                  {loading ? (
                    <div style={{width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite'}} />
                  ) : (
                    <svg viewBox="0 0 512 512">
                      <path fill="currentColor" d="M473 39.05a24 24 0 0 0-25.5-5.46L47.47 185h-.08a24 24 0 0 0 1 45.16l.41.13l137.3 58.63a16 16 0 0 0 15.54-3.59L422 80a7.07 7.07 0 0 1 10 10L226.66 310.26a16 16 0 0 0-3.59 15.54l58.65 137.38c.06.2.12.38.19.57c3.2 9.27 11.3 15.81 21.09 16.25h1a24.63 24.63 0 0 0 23-15.46L478.39 64.62A24 24 0 0 0 473 39.05"></path>
                    </svg>
                  )}
                </i>
              </button>
            </div>
          </div>
        </div>
        <div className="tags">
          <span>Correct Pose</span>
          <span>Breathing</span>
          <span>More</span>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .container_chat_bot {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .container-chat-options {
    position: relative;
    display: flex;
    /* Dark Sage Gradient instead of black */
    background: linear-gradient(
      to bottom right,
      #6b8f71,
      #4a6b50,
      #2d4431,
      #2d4431,
      #2d4431
    );
    border-radius: 16px;
    padding: 1.5px;
    overflow: hidden;

    &::after {
      position: absolute;
      content: "";
      top: -10px;
      left: -10px;
      background: radial-gradient(
        ellipse at center,
        #ffffff,
        rgba(255, 255, 255, 0.3),
        rgba(255, 255, 255, 0.1),
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0)
      );
      width: 30px;
      height: 30px;
      filter: blur(1px);
    }
  }

  .chat {
    display: flex;
    flex-direction: column;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 15px;
    width: 100%;
    overflow: hidden;
  }

  .chat-bot {
    position: relative;
    display: flex;
  }

  textarea {
    background-color: transparent;
    border-radius: 16px;
    border: none;
    width: 100%;
    height: 60px;
    color: #ffffff;
    font-family: "Nunito", sans-serif;
    font-size: 14px;
    font-weight: 400;
    padding: 12px;
    resize: none;
    outline: none;

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 5px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: #555;
      cursor: pointer;
    }

    &::placeholder {
      color: rgba(243, 246, 253, 0.8);
      transition: all 0.3s ease;
    }
    &:focus::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  }

  .options {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 10px;
  }

  .btns-add {
    display: flex;
    gap: 8px;

    & button {
      display: flex;
      color: rgba(255, 255, 255, 0.5);
      background-color: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;

      &.listening {
        color: #e07a5f; /* Coral when listening */
        animation: pulse 1.5s infinite;
      }

      &:hover {
        transform: translateY(-2px);
        color: #ffffff;
      }
    }
  }

  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.1); }
    100% { opacity: 1; transform: scale(1); }
  }

  .btn-submit {
    display: flex;
    padding: 2px;
    /* Sage to darker sage gradient */
    background-image: linear-gradient(to top, #4a6b50, #6b8f71, #4a6b50);
    border-radius: 10px;
    box-shadow: inset 0 6px 2px -4px rgba(255, 255, 255, 0.5);
    cursor: pointer;
    border: none;
    outline: none;
    transition: all 0.15s ease;

    & i {
      width: 32px;
      height: 32px;
      padding: 6px;
      background: rgba(0, 0, 0, 0.15);
      border-radius: 10px;
      backdrop-filter: blur(3px);
      color: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    & svg {
      transition: all 0.3s ease;
      width: 100%;
      height: 100%;
    }
    &:hover svg {
      color: #ffffff;
      filter: drop-shadow(0 0 5px #ffffff);
    }

    &:focus svg {
      color: #ffffff;
      filter: drop-shadow(0 0 5px #ffffff);
      transform: scale(1.1) rotate(20deg) translateX(1px);
    }

    &:active {
      transform: scale(0.92);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .tags {
    padding: 10px 0 0 0;
    display: flex;
    color: #ffffff;
    font-size: 11px;
    gap: 6px;

    & span {
      padding: 4px 10px;
      background-color: rgba(45, 68, 49, 0.8); /* Dark Sage */
      border: 1px solid rgba(107, 143, 113, 0.5); /* Sage */
      border-radius: 12px;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s;
      
      &:hover {
        background-color: #6b8f71; /* Sage */
      }
    }
  }
`;

export default RefChatBar;
