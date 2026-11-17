# Micro-front-end
Nome dos integrantes: André Gabriel Benato, Arthur Markowicz Lopes, Gustavo Tissot França, Luigi Morgenstern Milani


App	Pasta	Porta	Papel
shell	frontend/shell/	3000	Host que carrega os remotes
mfe-usuario	frontend/mfe-usuario/	3001	Cadastro, login e alteracao de dados
mfe-apartment	frontend/mfe-apartment/	3002	Feed de apartamentos com filtros (remote apartmentMfe/ApartmentFeed)
mfe-carona	frontend/mfe-carona/	3003	Buscar, oferecer e gerenciar caronas
mfe-chat	frontend/mfe-chat/	3004	Conversas 1:1 REST + STOMP via gateway (chatMfe/ChatInbox)
Shell + usuario:

cd frontend && npm run install:all && npm run build:remotes && npm start
Apartamentos (standalone na porta 3002; expoe remoteEntry.js para o shell):

cd apartment-mfe && npm install && npm run dev
Listagem autenticada: GET /api/v1/apartments via gateway (VITE_API_BASE_URL, default http://localhost:8090), com query params opcionais city, neighborhood, minRent, maxRent, bedrooms, available.

Cada servico de dominio usa o próprio banco (USER_DB_*, APARTMENT_DB_*, CARONA_DB_*, Mongo do chat). O apartment-service, o chat-service e o carona-service guardam apenas userId (referencia logica, sem FK entre bancos).
