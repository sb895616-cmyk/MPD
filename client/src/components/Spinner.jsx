export default function Spinner({ text = 'Loading...' }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
}
