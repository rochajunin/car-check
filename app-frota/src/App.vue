<template>
  <div style="font-family: sans-serif; min-height: 100vh; background-color: #f3f4f6;">
    <nav style="background: #1e293b; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
      <h2 style="margin: 0; font-size: 1.2rem;">🚗 CarCheck Frota</h2>
      <div>
        <router-link to="/motorista" style="color: white; margin-right: 15px; text-decoration: none;">📱 App Motorista</router-link>
        <router-link to="/admin" style="color: #38bdf8; text-decoration: none; font-weight: bold;">📊 Painel Admin</router-link>
      </div>
    </nav>
    <router-view />
  </div>
</template>