const base = [
    { id: 'emp-01', user: 'empleado1', pass: '123', rol: 'Empleado', url: 'empleado.html' },
    { id: 'emp-02', user: 'empleado2', pass: '123', rol: 'Empleado', url: 'empleado.html' },
    { id: 'emp-03', user: 'empleado3', pass: '123', rol: 'Empleado', url: 'empleado.html' },
    { id: 'emp-04', user: 'empleado4', pass: '123', rol: 'Empleado', url: 'empleado.html' },   
    { id: 'emp-05', user: 'empleado5', pass: '123', rol: 'Empleado', url: 'empleado.html' },
    { id: 'jur-01', user: 'jurado', pass: '123', rol: 'Jurado', url: 'jurado.html' }
];

function inicializarDatosVotacion() {
    if (!localStorage.getItem('innovaciones')) {
        const innovacionesIniciales = [
            { id: 1, nombre: 'Tejido térmico reciclado', descripcion: 'Fibra reutilizada con menor consumo de agua.', votos: 0 },
            { id: 2, nombre: 'Tintura natural sin fijadores tóxicos', descripcion: 'Pigmentos orgánicos de bajo impacto ambiental.', votos: 0 },
            { id: 3, nombre: 'Corte automatizado de retazos', descripcion: 'Optimización de patrones para reducir merma textil.', votos: 0 }
        ];
        localStorage.setItem('innovaciones', JSON.stringify(innovacionesIniciales));
    }

    if (!localStorage.getItem('votosRegistrados')) {
        localStorage.setItem('votosRegistrados', JSON.stringify([]));
    }

    if (localStorage.getItem('votacionAbierta') === null) {
        localStorage.setItem('votacionAbierta', JSON.stringify(true));
    }
}

function iniciarSesion(e) {
    e.preventDefault();
    const inputUser = document.getElementById('inputUser').value.trim();
    const inputPass = document.getElementById('inputPass').value.trim();

    const usuarioAutenticado = base.find(
        u => u.user === inputUser && u.pass === inputPass
    );

    if (usuarioAutenticado) {
        sessionStorage.setItem('sesionActiva', JSON.stringify(usuarioAutenticado));
        inicializarDatosVotacion();
        window.location.href = usuarioAutenticado.url;
    } else {
        document.getElementById('errorMsg').classList.remove('d-none');
    }
}

function cerrarSesion() {
    const confirmar = confirm("¿Estás seguro de cerrar sesión?");
    if (confirmar) {
        sessionStorage.removeItem('sesionActiva');
        window.location.href = "index.html";
    }
}

function verificarAcceso(rolRequerido) {
    const sesion = JSON.parse(sessionStorage.getItem('sesionActiva'));
    if (!sesion) {
        window.location.href = "index.html";
    } else if (sesion.rol !== rolRequerido) {
        window.location.href = sesion.url;
    } else {
        const info = document.getElementById('infoUsuario');
        if (info) {
            info.textContent = `${sesion.user} (${sesion.rol})`;
        }
        inicializarDatosVotacion();
    }
}

function saltarLoginSiAutenticado() {
    const sesion = JSON.parse(sessionStorage.getItem('sesionActiva'));
    if (sesion) {
        alert("Ya tienes una sesión iniciada como " + sesion.rol);
        window.location.href = sesion.url;
    }
}

function renderizarPanelEmpleado() {
    const sesion = JSON.parse(sessionStorage.getItem('sesionActiva'));
    const innovaciones = JSON.parse(localStorage.getItem('innovaciones')) || [];
    const votosRegistrados = JSON.parse(localStorage.getItem('votosRegistrados')) || [];
    const votacionAbierta = JSON.parse(localStorage.getItem('votacionAbierta'));

    const contenedor = document.getElementById('listaInnovaciones');
    const estadoMsg = document.getElementById('estadoVotacion');
    contenedor.innerHTML = '';

    const yaVoto = votosRegistrados.some(v => v.idUsuario === sesion.id);

    if (!votacionAbierta) {
        estadoMsg.textContent = "La votación está cerrada por el jurado. Ya no se permiten más votos.";
    } else if (yaVoto) {
        estadoMsg.textContent = "Ya registraste tu voto. Solo se permite votar por una innovación.";
    } else {
        estadoMsg.textContent = "Votación abierta: selecciona una sola innovación para emitir tu voto.";
    }

    innovaciones.forEach(item => {
        const deshabilitado = !votacionAbierta || yaVoto;
        const tarjeta = document.createElement('div');
        tarjeta.className = 'card mb-3 p-3';
        tarjeta.innerHTML = `
            <h5>${item.nombre}</h5>
            <p>${item.descripcion}</p>
            <button class="btn btn-primary" ${deshabilitado ? 'disabled' : ''} onclick="votarInnovacion(${item.id})">
                ${yaVoto ? 'Voto registrado' : 'Votar'}
            </button>
        `;
        contenedor.appendChild(tarjeta);
    });
}

function votarInnovacion(idInnovacion) {
    const sesion = JSON.parse(sessionStorage.getItem('sesionActiva'));
    const votacionAbierta = JSON.parse(localStorage.getItem('votacionAbierta'));
    const innovaciones = JSON.parse(localStorage.getItem('innovaciones')) || [];
    const votosRegistrados = JSON.parse(localStorage.getItem('votosRegistrados')) || [];

    if (!sesion) {
        window.location.href = "index.html";
        return;
    }

    if (!votacionAbierta) {
        alert("La votación ya fue cerrada.");
        renderizarPanelEmpleado();
        return;
    }

    const yaVoto = votosRegistrados.some(v => v.idUsuario === sesion.id);
    if (yaVoto) {
        alert("Ya has emitido tu voto anteriormente.");
        renderizarPanelEmpleado();
        return;
    }

    const innovacionSeleccionada = innovaciones.find(i => i.id === idInnovacion);
    if (innovacionSeleccionada) {
        innovacionSeleccionada.votos += 1;
        votosRegistrados.push({
            idUsuario: sesion.id,
            usuario: sesion.user,
            idInnovacion: idInnovacion
        });

        localStorage.setItem('innovaciones', JSON.stringify(innovaciones));
        localStorage.setItem('votosRegistrados', JSON.stringify(votosRegistrados));

        alert("¡Tu voto ha sido registrado con éxito!");
        renderizarPanelEmpleado();
    }
}

function renderizarPanelJurado() {
    const innovaciones = JSON.parse(localStorage.getItem('innovaciones')) || [];
    const votosRegistrados = JSON.parse(localStorage.getItem('votosRegistrados')) || [];
    const votacionAbierta = JSON.parse(localStorage.getItem('votacionAbierta'));

    const tablaResultados = document.getElementById('tablaResultados');
    const badgeEstado = document.getElementById('badgeEstado');
    const btnCerrar = document.getElementById('btnCerrarVotacion');
    const totalVotosEl = document.getElementById('totalVotos');

    badgeEstado.textContent = votacionAbierta ? 'Abierta' : 'Cerrada';
    btnCerrar.disabled = !votacionAbierta;
    totalVotosEl.textContent = votosRegistrados.length;

    tablaResultados.innerHTML = '';
    innovaciones.forEach(item => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${item.nombre}</td>
            <td>${item.descripcion}</td>
            <td><strong>${item.votos}</strong></td>
        `;
        tablaResultados.appendChild(fila);
    });
}

function cerrarVotacion() {
    const confirmar = confirm("¿Deseas cerrar la votación? Los empleados ya no podrán votar.");
    if (confirmar) {
        localStorage.setItem('votacionAbierta', JSON.stringify(false));
        renderizarPanelJurado();
    }
}
window.addEventListener('storage', () => {
    if (document.getElementById('tablaResultados')) {
        renderizarPanelJurado();
    }
    if (document.getElementById('listaInnovaciones')) {
        renderizarPanelEmpleado();
    }
});