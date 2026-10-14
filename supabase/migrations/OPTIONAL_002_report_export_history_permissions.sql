-- OPCIONAL: aplicar SOLO tras aprobación del responsable de Supabase.
-- No crea tablas ni funciones, no cambia políticas RLS existentes.
-- El esquema inicial permite exportar reportes a gerente/analista/almacen,
-- pero no les da el permiso `create` necesario para guardar report_exports.
-- Esta migración idempotente sincroniza esos permisos.
insert into public.role_permissions(role_key,module_key,action_key)
values
  ('gerente','reportes','create'),
  ('analista','reportes','create'),
  ('almacen','reportes','create')
on conflict (role_key,module_key,action_key) do nothing;
