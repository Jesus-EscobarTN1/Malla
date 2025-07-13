// LÍMITES DE CRÉDITO POR SEMESTRE
const limiteCreditosPorSemestre = {
  1: 24, 2: 24, 3: 23, 4: 22, 5: 23,
  6: 23, 7: 23, 8: 21, 9: 21,
  10: 23, 11: 25, 12: 25
};

let semestreActivo = 1;

// GUARDAR Y CARGAR PROGRESO
function guardarProgreso() {
  const progreso = materias.map(m => m.aprobada || false);
  localStorage.setItem("progresoMalla", JSON.stringify(progreso));
}

function cargarProgreso() {
  const guardado = localStorage.getItem("progresoMalla");
  if (!guardado) return;
  const estados = JSON.parse(guardado);
  materias.forEach((m, i) => {
    m.aprobada = estados[i] || false;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const selector = document.getElementById("selectorSemestre");
  selector.addEventListener("change", () => {
    semestreActivo = parseInt(selector.value);
    renderMaterias();
  });
});

function puedeCursarse(materia, aprobadas) {
  if (!materia.prerequisitos || materia.prerequisitos.length === 0) return true;
  for (const req of materia.prerequisitos) {
    if (req.startsWith("*aprobadas hasta el semestre")) {
      const n = parseInt(req.split("semestre")[1]);
      return aprobadas.every(m => m.aprobada && m.semestre <= n);
    } else {
      if (!aprobadas.find(m => m.nombre === req)) return false;
    }
  }
  return true;
}

function renderMaterias() {
  const contenedor = document.getElementById("contenedor");
  const resumen = document.getElementById("resumen");
  const filtroTexto = document.getElementById("buscador").value.toLowerCase();
  contenedor.innerHTML = "";

  const aprobadas = materias.filter(m => m.aprobada);
  const totalCreditos = materias.reduce((acc, m) => acc + (m.creditos || 0), 0);
  const materiasAprobadas = aprobadas.length;
  const creditosAprobados = aprobadas.reduce((acc, m) => acc + (m.creditos || 0), 0);
  const porcentaje = Math.round((creditosAprobados / totalCreditos) * 100);
  resumen.textContent = `Aprobadas: ${materiasAprobadas} de ${materias.length} | Créditos: ${creditosAprobados} / ${totalCreditos} (${porcentaje}%)`;

  let usadosEnActivo = aprobadas.filter(m => m.semestre === semestreActivo).reduce((sum, m) => sum + m.creditos, 0);
  const disponible = limiteCreditosPorSemestre[semestreActivo] || 0;

  for (let s = 1; s <= 12; s++) {
    const materiasSemestre = materias.filter(m => m.semestre === s);
    if (materiasSemestre.length === 0) continue;

    const h2 = document.createElement("h2");
    h2.textContent = `Semestre ${s}`;
    contenedor.appendChild(h2);

    materiasSemestre.forEach(materia => {
      if (!materia.nombre.toLowerCase().includes(filtroTexto)) return;

      const div = document.createElement("div");
      const estaAprobada = !!materia.aprobada;
      const sinRequisitos = !materia.prerequisitos || materia.prerequisitos.length === 0;
      const cumpleRequisitos = puedeCursarse(materia, aprobadas);
      const esElegible = (materia.semestre <= semestreActivo && cumpleRequisitos) || (materia.semestre > semestreActivo && sinRequisitos);
      const dentroLimite = (materia.semestre !== semestreActivo || estaAprobada || usadosEnActivo + materia.creditos <= disponible);
      const habilitada = esElegible && dentroLimite;

      div.className = "materia";
      if (estaAprobada) div.classList.add("aprobada");
      else if (habilitada) div.classList.add("habilitada");
      else div.classList.add("bloqueada");

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = estaAprobada;
      input.disabled = !habilitada && !estaAprobada;

      input.addEventListener("change", () => {
        materia.aprobada = input.checked;
        guardarProgreso();
        renderMaterias();
      });

      const label = document.createElement("label");
      label.textContent = `${materia.nombre} (${materia.creditos} cr.)`;
      if (materia.descripcion) div.title = materia.descripcion;

      div.appendChild(input);
      div.appendChild(label);
      contenedor.appendChild(div);
    });
  }
}

document.getElementById("buscador").addEventListener("input", renderMaterias);
cargarProgreso();
