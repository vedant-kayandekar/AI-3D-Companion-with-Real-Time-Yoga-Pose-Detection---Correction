import React from 'react';
import styled from 'styled-components';

const RefButton = ({ children, onClick, type = "button", disabled, className, style, icon, size = "normal" }) => {
  return (
    <StyledWrapper className={className} style={style} size={size}>
      <button type={type} className="button" onClick={onClick} disabled={disabled}>
        <div className="inner">
          {icon && (
            <div className="svgs">
              {icon}
            </div>
          )}
          {children}
        </div>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .button {
    cursor: pointer;
    border: solid 4px #161616;
    border-top: none;
    border-radius: 20px;
    position: relative;
    box-shadow: 0px 4px 10px #00000062, 0px 10px 40px -10px #000000a6,
      0px 12px 45px -15px #00000071;
    transition: all 0.3s ease;
    padding: 0;
    background: transparent;
    transform: ${props => props.size === 'small' ? 'scale(0.75)' : 'scale(1)'};
    transform-origin: center center;
  }
  
  .button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .inner {
    padding: ${props => props.size === 'small' ? '8px 20px' : '12px 30px'};
    font-size: ${props => props.size === 'small' ? '0.9rem' : '1.1rem'};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-weight: 600;
    letter-spacing: 1px;
    border-bottom: solid 3px #4a6b50; /* Dark Sage border */
    border-radius: 16px;
    background: linear-gradient(180deg, #6b8f71, #2d4431); /* Sage to Dark gradient */
    color: #fff;
    text-shadow: 1px 1px #000, 0 0 9px rgba(255, 255, 255, 0.4);
    height: 100%;
    width: 100%;
  }
  
  .svgs {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }
  
  .svgs > * {
    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.4)) drop-shadow(1px 1px 0px #000);
  }

  .button:active:not(:disabled) {
    box-shadow: none;
    transform: translateY(2px);
  }
`;

export default RefButton;
