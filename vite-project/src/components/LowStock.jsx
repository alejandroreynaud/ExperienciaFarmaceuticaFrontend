const LowStock = () => {
  const products = [
    //AGREGAR AQUI EL ENDPOINT CON LOS DATOS QUE SE CONSIGAN
    { name: "Paracetamol 500mg", current: 15, max: 50 },
    { name: "Ibuprofeno 400mg", current: 8, max: 30 },
    { name: "Amoxicilina 500mg", current: 12, max: 40 },
    { name: "Omeprazol 20mg", current: 5, max: 25 },
    { name: "Losartán 50mg", current: 18, max: 35 },
  ];

  return (
    <div className="lowstock">
      <h3>Productos con Bajo Stock</h3>

      {products.map((p, i) => {
        const percent = (p.current / p.max) * 100;

        return (
          <div key={i} className="stock-item">
            <div className="stock-header">
              <span>{p.name}</span>
              <span className="stock-value">{p.current} / {p.max}</span>
            </div>

            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${percent}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LowStock;