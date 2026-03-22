const Notifications = () => {
  const data = [
    //AGREGAR AQUI LOS ENDPOINTS DE LAS NOTIFICACIONES
    {
      title: "Stock Bajo",
      desc: "Paracetamol 500mg tiene solo 15 unidades",
      time: "Hace 5 min"
    },
    {
      title: "Próximo a Vencer",
      desc: "Amoxicilina 500mg vence en 10 días",
      time: "Hace 1 hora"
    },
    {
      title: "Venta Completada",
      desc: "Venta #1234 por L. 850.00",
      time: "Hace 2 horas"
    },
    {
      title: "Nuevo Cliente",
      desc: "María González registrada",
      time: "Hace 3 horas"
    }
  ];

  return (
    <div className="notifications">
      <h3>Notificaciones</h3>

      {data.map((n, i) => (
        <div key={i} className="notification-item">
          <strong>{n.title}</strong>
          <p>{n.desc}</p>
          <small>{n.time}</small>
        </div>
      ))}
    </div>
  );
};

export default Notifications;