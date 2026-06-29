function Toast({ message }) {
  return (
    <div id="toast" className={`toast ${message ? 'on' : ''}`}>
      <span>{message}</span>
    </div>
  );
}

export default Toast;
