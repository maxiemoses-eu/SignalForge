export default function Notification({ type, message }) {
  if (!message) return null;

  return (
    <div role="alert" className={`notice ${type}`}>
      {message}
    </div>
  );
}
