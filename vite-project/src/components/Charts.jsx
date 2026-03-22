import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

const Charts = ({ weeklySales, monthlyIncome }) => {
  return (
    <div className="charts">

      <div className="chart-box">
        <h3>Ventas Semanales</h3>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={weeklySales}>
            <CartesianGrid stroke="#eee" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="ventas" 
              stroke="#3b82f6" 
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-box">
        <h3>Ingresos Mensuales</h3>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyIncome}>
            <CartesianGrid stroke="#eee" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar 
              dataKey="ingresos" 
              fill="#10b981" 
              radius={[6,6,0,0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default Charts;