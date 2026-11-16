 <script>
        // Inicializar iconos de Lucide
        lucide.createIcons();

        let solutionChart = null;
        let simulationData = [];
        let currentInspectedIndex = 0;

        // Ejemplos predefinidos
        const examples = {
            exp: { equation: 'x + y', x0: 0, y0: 1, xf: 1, steps: 10, exact: '2*exp(x) - x - 1' },
            osc: { equation: 'cos(x) - y', x0: 0, y0: 0, xf: 6, steps: 30, exact: '0.5*(sin(x) + cos(x) - exp(-x))' },
            nonlin: { equation: '-2*x*y', x0: 0, y0: 1, xf: 2, steps: 20, exact: 'exp(-x^2)' }
        };

        function loadExample(key) {
            const ex = examples[key];
            if (!ex) return;
            document.getElementById('equation').value = ex.equation;
            document.getElementById('x0').value = ex.x0;
            document.getElementById('y0').value = ex.y0;
            document.getElementById('xf').value = ex.xf;
            document.getElementById('steps').value = ex.steps;
            document.getElementById('exactEquation').value = ex.exact;
            syncStepFields('n');
            runSimulation();
        }

        function selectVariant(variant) {
            document.getElementById('variant').value = variant;
            ['heun', 'midpoint', 'ralston'].forEach(v => {
                const btn = document.getElementById(`btn-variant-${v}`);
                if (v === variant) {
                    btn.className = "variant-dial border-2 border-ink-900 bg-ink-900 text-paper-50 p-2.5 text-left transition-all cursor-pointer shadow-hard-sm";
                } else {
                    btn.className = "variant-dial border-2 border-ink-900 bg-paper-50 text-ink-900 hover:bg-paper-200 p-2.5 text-left transition-all cursor-pointer";
                }
            });

            const title = document.getElementById('formulaTitle');
            const desc = document.getElementById('formulaDescription');
            const k1 = document.getElementById('formulaK1');
            const k2 = document.getElementById('formulaK2');
            const yNext = document.getElementById('formulaYNext');

            if (variant === 'heun') {
                title.textContent = 'Método de Heun (a₂ = 1/2)';
                desc.textContent = 'Regla trapezoidal / Predictor-Corrector';
                k1.textContent = 'k₁ = f(xᵢ, yᵢ)';
                k2.textContent = 'k₂ = f(xᵢ + h, yᵢ + h·k₁)';
                yNext.textContent = 'yᵢ₊₁ = yᵢ + (h/2)·(k₁ + k₂)';
            } else if (variant === 'midpoint') {
                title.textContent = 'Método del Punto Medio (a₂ = 1)';
                desc.textContent = 'Runge-Kutta de orden 2 modificado';
                k1.textContent = 'k₁ = f(xᵢ, yᵢ)';
                k2.textContent = 'k₂ = f(xᵢ + h/2, yᵢ + (h/2)·k₁)';
                yNext.textContent = 'yᵢ₊₁ = yᵢ + h·k₂';
            } else if (variant === 'ralston') {
                title.textContent = 'Método de Ralston (a₂ = 2/3)';
                desc.textContent = 'Minimización de cota de error de truncamiento';
                k1.textContent = 'k₁ = f(xᵢ, yᵢ)';
                k2.textContent = 'k₂ = f(xᵢ + (3/4)h, yᵢ + (3/4)h·k₁)';
                yNext.textContent = 'yᵢ₊₁ = yᵢ + (h/3)·(k₁ + 2·k₂)';
            }

            runSimulation();
        }

        function switchView(viewName) {
            ['all', 'chart', 'table', 'step', 'syntax'].forEach(v => {
                const tab = document.getElementById(`tab-${v}`);
                if (tab) {
                    if (v === viewName) {
                        tab.className = "view-tab px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider border-2 border-ink-900 bg-ink-900 text-paper-50 transition-all whitespace-nowrap cursor-pointer";
                    } else {
                        tab.className = "view-tab px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider border-2 border-ink-900 bg-paper-50 text-ink-900 hover:bg-paper-200 transition-all whitespace-nowrap cursor-pointer";
                    }
                }
            });

            const chartSec = document.getElementById('section-chart');
            const tableSec = document.getElementById('section-table');
            const stepSec = document.getElementById('section-step');
            const syntaxSec = document.getElementById('section-syntax');

            [chartSec, tableSec, stepSec, syntaxSec].forEach(s => s.classList.add('hidden'));

            if (viewName === 'all') {
                chartSec.classList.remove('hidden');
                tableSec.classList.remove('hidden');
                stepSec.classList.remove('hidden');
            } else if (viewName === 'chart') {
                chartSec.classList.remove('hidden');
            } else if (viewName === 'table') {
                tableSec.classList.remove('hidden');
            } else if (viewName === 'step') {
                stepSec.classList.remove('hidden');
            } else if (viewName === 'syntax') {
                syntaxSec.classList.remove('hidden');
            }
        }

        // Lógica restaurada para alternar modo de discretización N vs H
        function setStepMode(mode) {
            document.getElementById('stepMode').value = mode;
            const btnN = document.getElementById('mode-btn-n');
            const btnH = document.getElementById('mode-btn-h');
            const stepsInput = document.getElementById('steps');
            const stepSizeInput = document.getElementById('stepSize');

            if (mode === 'n') {
                btnN.className = "px-2 py-0.5 font-mono text-[10px] font-bold uppercase bg-ink-900 text-paper-50 transition-colors cursor-pointer shadow-hard-sm";
                btnH.className = "px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-ink-900 hover:bg-paper-300 transition-colors cursor-pointer";
                stepsInput.removeAttribute('readonly');
                stepsInput.className = "w-full border-2 border-ink-900 bg-white px-2.5 py-1.5 font-mono text-sm font-semibold text-ink-900 focus:outline-none";
                stepSizeInput.setAttribute('readonly', true);
                stepSizeInput.className = "w-full border-2 border-paper-300 bg-paper-200 px-2.5 py-1.5 font-mono text-sm font-semibold text-ink-700 focus:outline-none";
                syncStepFields('n');
            } else {
                btnH.className = "px-2 py-0.5 font-mono text-[10px] font-bold uppercase bg-ink-900 text-paper-50 transition-colors cursor-pointer shadow-hard-sm";
                btnN.className = "px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-ink-900 hover:bg-paper-300 transition-colors cursor-pointer";
                stepSizeInput.removeAttribute('readonly');
                stepSizeInput.className = "w-full border-2 border-ink-900 bg-white px-2.5 py-1.5 font-mono text-sm font-semibold text-ink-900 focus:outline-none";
                stepsInput.setAttribute('readonly', true);
                stepsInput.className = "w-full border-2 border-paper-300 bg-paper-200 px-2.5 py-1.5 font-mono text-sm font-semibold text-ink-700 focus:outline-none";
                syncStepFields('h');
            }
        }

        function syncStepFields(changed) {
            const x0 = parseFloat(document.getElementById('x0').value);
            const xf = parseFloat(document.getElementById('xf').value);
            const mode = document.getElementById('stepMode').value;
            const nInput = document.getElementById('steps');
            const hInput = document.getElementById('stepSize');

            if (isNaN(x0) || isNaN(xf) || xf <= x0) return;

            if (mode === 'n') {
                let n = parseInt(nInput.value);
                if (isNaN(n) || n < 1) n = 1;
                const h = (xf - x0) / n;
                hInput.value = h.toFixed(6);
            } else {
                let h = parseFloat(hInput.value);
                if (isNaN(h) || h <= 0) h = 0.1;
                const n = Math.max(1, Math.round((xf - x0) / h));
                nInput.value = n;
            }
        }

        function showAlert(title, message) {
            document.getElementById('alertTitle').textContent = title;
            document.getElementById('alertMessage').textContent = message;
            document.getElementById('alertBox').classList.remove('hidden');
        }

        function hideAlert() {
            document.getElementById('alertBox').classList.add('hidden');
        }

        function insertSyntax(token) {
            const eqInput = document.getElementById('equation');
            const start = eqInput.selectionStart;
            const end = eqInput.selectionEnd;
            const val = eqInput.value;
            eqInput.value = val.substring(0, start) + token + val.substring(end);
            eqInput.focus();
            eqInput.setSelectionRange(start + token.length, start + token.length);
            switchView('all');
        }

        function runSimulation() {
            hideAlert();
            try {
                const eqStr = document.getElementById('equation').value.trim();
                const exactStr = document.getElementById('exactEquation').value.trim();
                const x0 = parseFloat(document.getElementById('x0').value);
                const y0 = parseFloat(document.getElementById('y0').value);
                const xf = parseFloat(document.getElementById('xf').value);
                const n = parseInt(document.getElementById('steps').value);
                const variant = document.getElementById('variant').value;

                if (!eqStr) throw new Error('La ecuación diferencial f(x,y) no puede estar vacía.');
                if (isNaN(x0) || isNaN(y0) || isNaN(xf) || isNaN(n)) throw new Error('Verifica que los valores numéricos sean válidos.');
                if (xf <= x0) throw new Error('El valor final x_f debe ser estrictamente mayor que x₀.');

                const compiledFn = math.compile(eqStr);
                const compiledExact = exactStr ? math.compile(exactStr) : null;

                compiledFn.evaluate({ x: x0, y: y0 });

                const h = (xf - x0) / n;
                simulationData = [];

                let x = x0;
                let y = y0;

                let a1, a2, p1, q1;
                if (variant === 'heun') {
                    a1 = 0.5; a2 = 0.5; p1 = 1.0; q1 = 1.0;
                } else if (variant === 'midpoint') {
                    a1 = 0.0; a2 = 1.0; p1 = 0.5; q1 = 0.5;
                } else {
                    a1 = 1/3; a2 = 2/3; p1 = 0.75; q1 = 0.75;
                }

                for (let i = 0; i <= n; i++) {
                    let exactVal = null;
                    let errorRel = null;

                    if (compiledExact) {
                        try {
                            exactVal = compiledExact.evaluate({ x: x });
                            if (Math.abs(exactVal) > 1e-12) {
                                errorRel = Math.abs((exactVal - y) / exactVal) * 100;
                            } else {
                                errorRel = Math.abs(exactVal - y) * 100;
                            }
                        } catch (e) {
                            exactVal = null;
                        }
                    }

                    let k1 = null, k2 = null;
                    if (i < n) {
                        k1 = compiledFn.evaluate({ x: x, y: y });
                        k2 = compiledFn.evaluate({ x: x + p1 * h, y: y + q1 * h * k1 });
                    }

                    simulationData.push({
                        i: i,
                        x: x,
                        y: y,
                        k1: k1,
                        k2: k2,
                        exact: exactVal,
                        error: errorRel
                    });

                    if (i < n) {
                        y = y + h * (a1 * k1 + a2 * k2);
                        x = x0 + (i + 1) * h;
                    }
                }

                updateKPIs();
                renderTable();
                currentInspectedIndex = 0;
                renderStepInspector();
                renderChart();

            } catch (err) {
                showAlert('Error en el cálculo numérico', err.message);
            }
        }

        function updateKPIs() {
            if (simulationData.length === 0) return;
            const last = simulationData[simulationData.length - 1];
            document.getElementById('kpiXf').textContent = last.x.toFixed(4);
            document.getElementById('kpiYf').textContent = last.y.toFixed(6);
            document.getElementById('kpiExact').textContent = last.exact !== null ? last.exact.toFixed(6) : 'N/A';
            document.getElementById('kpiError').textContent = last.error !== null ? last.error.toFixed(4) + '%' : 'N/A';
        }

        function renderTable() {
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = '';
            simulationData.forEach(row => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-paper-100 transition-colors";
                tr.innerHTML = `
                    <td class="p-3 border-r border-paper-300 font-bold">${row.i}</td>
                    <td class="p-3 border-r border-paper-300">${row.x.toFixed(4)}</td>
                    <td class="p-3 border-r border-paper-300 font-bold text-vermilion-600">${row.y.toFixed(6)}</td>
                    <td class="p-3 border-r border-paper-300">${row.k1 !== null ? row.k1.toFixed(6) : '-'}</td>
                    <td class="p-3 border-r border-paper-300">${row.k2 !== null ? row.k2.toFixed(6) : '-'}</td>
                    <td class="p-3 border-r border-paper-300 text-cobalt-700">${row.exact !== null ? row.exact.toFixed(6) : 'N/A'}</td>
                    <td class="p-3">${row.error !== null ? row.error.toFixed(4) + '%' : 'N/A'}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        function changeInspectedStep(dir) {
            if (simulationData.length === 0) return;
            currentInspectedIndex += dir;
            if (currentInspectedIndex < 0) currentInspectedIndex = 0;
            if (currentInspectedIndex >= simulationData.length - 1) currentInspectedIndex = Math.max(0, simulationData.length - 2);
            renderStepInspector();
        }

        function renderStepInspector() {
            const container = document.getElementById('stepInspectorContent');
            const counter = document.getElementById('stepInspectorCounter');
            if (simulationData.length <= 1) {
                container.innerHTML = '<p class="text-ink-500">No hay suficientes pasos para inspeccionar.</p>';
                return;
            }

            const idx = Math.min(currentInspectedIndex, simulationData.length - 2);
            counter.textContent = `Paso i = ${idx}`;
            const r = simulationData[idx];
            const next = simulationData[idx + 1];
            const h = parseFloat(document.getElementById('stepSize').value);
            const variant = document.getElementById('variant').value;

            let k2Formula = '';
            let nextFormula = '';
            if (variant === 'heun') {
                k2Formula = `f(xᵢ + h, yᵢ + h·k₁) = f(${r.x.toFixed(4)} + ${h}, ${r.y.toFixed(4)} + ${h}·(${r.k1.toFixed(4)}))`;
                nextFormula = `yᵢ + (h/2)·(k₁ + k₂) = ${r.y.toFixed(4)} + (${h}/2)·(${r.k1.toFixed(4)} + ${r.k2.toFixed(4)})`;
            } else if (variant === 'midpoint') {
                k2Formula = `f(xᵢ + h/2, yᵢ + (h/2)·k₁) = f(${r.x.toFixed(4)} + ${h}/2, ${r.y.toFixed(4)} + (${h}/2)·(${r.k1.toFixed(4)}))`;
                nextFormula = `yᵢ + h·k₂ = ${r.y.toFixed(4)} + ${h}·(${r.k2.toFixed(4)})`;
            } else {
                k2Formula = `f(xᵢ + 3h/4, yᵢ + 3h·k₁/4) = f(${r.x.toFixed(4)} + 3(${h})/4, ${r.y.toFixed(4)} + 3(${h})·(${r.k1.toFixed(4)})/4)`;
                nextFormula = `yᵢ + (h/3)·(k₁ + 2k₂) = ${r.y.toFixed(4)} + (${h}/3)·(${r.k1.toFixed(4)} + 2·(${r.k2.toFixed(4)}))`;
            }

            container.innerHTML = `
                <div class="space-y-3">
                    <div class="p-3 bg-paper-100 border-2 border-ink-900">
                        <strong>Estado Inicial del Paso:</strong> x<sub>${r.i}</sub> = ${r.x.toFixed(4)}, &nbsp; y<sub>${r.i}</sub> = ${r.y.toFixed(6)}
                    </div>
                    <div class="p-3 bg-white border-2 border-ink-900">
                        <strong class="text-cobalt-700">1. Pendiente k₁:</strong><br>
                        k₁ = f(xᵢ, yᵢ) = ${r.k1.toFixed(6)}
                    </div>
                    <div class="p-3 bg-white border-2 border-ink-900">
                        <strong class="text-cobalt-700">2. Pendiente k₂:</strong><br>
                        ${k2Formula} = <strong>${r.k2.toFixed(6)}</strong>
                    </div>
                    <div class="p-3 bg-cobalt-50 border-2 border-ink-900">
                        <strong class="text-vermilion-600">3. Nuevo Valor y<sub>${next.i}</sub>:</strong><br>
                        y<sub>${next.i}</sub> = ${nextFormula} = <strong>${next.y.toFixed(6)}</strong>
                    </div>
                </div>
            `;
        }

        function renderChart() {
            const ctx = document.getElementById('solutionChart').getContext('2d');
            const approxPoints = simulationData.map(d => ({ x: d.x, y: d.y }));
            const exactPoints = simulationData.map(d => d.exact !== null ? ({ x: d.x, y: d.exact }) : null).filter(Boolean);

            if (solutionChart) solutionChart.destroy();

            const datasets = [{
                type: 'line',
                label: 'RK2 Aprox.',
                data: approxPoints,
                borderColor: '#DC2626',
                backgroundColor: '#DC2626',
                borderWidth: 2,
                borderDash: [4, 4],
                pointStyle: 'rect',
                pointRadius: 4,
                pointBackgroundColor: '#DC2626',
                pointBorderColor: '#18181B',
                pointBorderWidth: 1.5,
                showLine: true,
                tension: 0,
                order: 1
            }];

            if (exactPoints.length > 0) {
                datasets.push({
                    type: 'line',
                    label: 'Exacta y(x)',
                    data: exactPoints,
                    borderColor: '#1D4ED8',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    showLine: true,
                    tension: 0.1,
                    order: 2
                });
                document.getElementById('exactLegendBadge').classList.remove('hidden');
            } else {
                document.getElementById('exactLegendBadge').classList.add('hidden');
            }

            solutionChart = new Chart(ctx, {
                type: 'line',
                data: { datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: {
                            type: 'linear',
                            title: { display: true, text: 'VARIABLE INDEPENDIENTE [x]', font: { family: 'JetBrains Mono', weight: 'bold' } },
                            grid: { color: 'rgba(24, 24, 27, 0.08)' },
                            border: { color: '#18181B', width: 2 }
                        },
                        y: {
                            type: 'linear',
                            title: { display: true, text: 'FUNCIÓN SOLUCIÓN [y(x)]', font: { family: 'JetBrains Mono', weight: 'bold' } },
                            grid: { color: 'rgba(24, 24, 27, 0.08)' },
                            border: { color: '#18181B', width: 2 }
                        }
                    }
                }
            });
        }

        function exportToCSV() {
            if (simulationData.length === 0) {
                showAlert('Aviso', 'No hay datos simulados para exportar.');
                return;
            }
            let csv = 'i,x_i,y_i_RK2,k1,k2,y_exacta,error_relativo_pct\n';
            simulationData.forEach(r => {
                csv += `${r.i},${r.x},${r.y},${r.k1 !== null ? r.k1 : ''},${r.k2 !== null ? r.k2 : ''},${r.exact !== null ? r.exact : ''},${r.error !== null ? r.error : ''}\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'runge_kutta_rk2_data.csv';
            a.click();
            URL.revokeObjectURL(url);
        }

        // Ejecutar simulación inicial al cargar la página
        window.addEventListener('DOMContentLoaded', () => {
            syncStepFields('n');
            runSimulation();
        });
    </script>
