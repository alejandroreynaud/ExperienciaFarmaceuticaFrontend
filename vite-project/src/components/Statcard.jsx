const StatCard = ({ title, value, extra, color }) => {

  const colors = {
    green: "#16a34a",
    orange: "#f97316",
    red: "#ef4444",
    blue: "#3b82f6"
  };

  return (
    <div style={{
      flex: 1,
      background: "#fff",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
    }}>
      <p>{title}</p>

      <h2>{value}</h2>

      <span style={{ color: colors[color] }}>
        {extra}
      </span>
    </div>
  );
};

export default StatCard;