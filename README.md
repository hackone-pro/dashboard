# 📊 Dashboard SOC

Projeto de dashboard web desenvolvido em **React 19**, com **Vite** como bundler e suporte a **TailwindCSS** para estilos. Visualizações gráficas são geradas com **ApexCharts**. Ambiente de produção containerizado com Docker.

---

## 🚀 Tecnologias utilizadas

| Ferramenta         | Versão           | Descrição                              |
|--------------------|------------------|----------------------------------------|
| [Node.js](https://nodejs.org/)         | `>=20.19.0` ou `>=22.12.0` | Ambiente de execução JavaScript         |
| [React](https://reactjs.org/)          | `^19.1.0`          | Biblioteca para construção da UI       |
| [Vite](https://vitejs.dev/)            | `^7.0.4`           | Empacotador e servidor de desenvolvimento |
| [Tailwind CSS](https://tailwindcss.com/)| `^4.1.11`          | Utilitário de estilos CSS              |
| [ApexCharts](https://apexcharts.com/)  | `^5.2.0`           | Gráficos interativos                   |
| [React ApexCharts](https://github.com/apexcharts/react-apexcharts) | `^1.7.0` | Integração com React                   |
| [ESLint](https://eslint.org/)          | `^9.30.1`          | Linter para manter qualidade do código |
| [serve](https://www.npmjs.com/package/serve) | latest (produção) | Servidor estático usado no Docker      |

---

## 📦 Instalação local (sem Docker)

> Requer: Node.js `>=20.19.0`

```bash
cd frontend
npm install
npm run dev