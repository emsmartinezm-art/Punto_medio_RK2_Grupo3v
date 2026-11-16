## Integrantes
- Laura Riascos - Fundamentos
- Melanie Castro - Desarrollo
- David Ortiz - Programación
- Salomé Martínez - Aplicaciones y publicación

## Descripción del Proyecto
Herramienta web interactiva diseñada para resolver ecuaciones diferenciales de primer orden utilizando el método numérico de Runge-Kutta (RK2). Incluye un selector interactivo para calcular soluciones aproximadas mediante los métodos de Heun, Ralston o punto medio.

## Objetivo
Resolver ecuaciones diferenciales de primer orden $y' = f(x,y)$ con condiciones iniciales, eligiendo entre los métodos numéricos de Heun, Ralston o punto medio.

# MÉTODO RUNGE-KUTTA DE SEGUNDO ORDEN
Método genérico:

$$
y_{i+1} = y_i + h(a_1 K_1 + a_2 K_2)
$$

- Si se da el intervalo [$x_0, x_f$]:

$$
h = \frac{x_f - x_0}{n}
$$

  - $h$ siempre es positivo (preferiblemente pequeño, ej: $0.2$, $0.8$).
  - $n$ es un número entero positivo.

$$
K_1 = f(x_i, y_i)
$$

$$
K_2 = f(x_i + qh, y_i + qhK_1)
$$

$$
a_1 = 1 - a_2
$$

$$
q = \frac{1}{2a_2}
$$

$$
x_{i+1} = x_i + h
$$

Para cada variación se utilizan los siguientes parámetros:
- $a_2 = \frac{1}{2}$ — Método de Heun
- $a_2 = \frac{2}{3}$ — Método de Ralston
- $a_2 = 1$ — Método del Punto Medio

## Uso
1. Abrir el enlace de GitHub Pages.
2. Ingresar los valores de $f(x,y)$, $x_0$, $y_0$, $x_f$ y $N$.
3. Escoger la variante del método de preferencia.
4. Pulsar "Ejecutar Integración RK2".

# Prueba de referencia
$$
f(x,y) = x + y; \qquad x_0 = 0; \qquad y_0 = 10; \qquad x_f = 1; \qquad n = 10
$$

# Enlace público

# Bibliografía
[1] M. Ayala, "65. Método de Punto Medio (Método particular de Runge Kutta de 2do orden) parte 1," YouTube, 17 de diciembre de 2020. [Archivo de video]. Disponible: https://www.youtube.com/watch?v=VQlkzYMSHzo. [Accedido: Nov. 15, 2026].

[2] M. Ayala, "66. Método de punto medio (Método particular de Runge Kutta de 2do orden en excel) parte 2," YouTube, 17 de diciembre de 2020. [Archivo de video]. Disponible: https://www.youtube.com/watch?v=GNuPjChilJQ. [Accedido: Nov. 15, 2026].
