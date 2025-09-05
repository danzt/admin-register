import { pool } from '../../utils/db'

export default defineEventHandler(async event => {
  try {
    const url = getRequestURL(event)
    const key = url.searchParams.get('key')
    if (key !== 'special_setup_key') {
      setResponseStatus(event, 401)
      return { error: 'Acceso no autorizado' }
    }

    const sql = `
    CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      EXECUTE sql;
      RETURN json_build_object('success', true);
    EXCEPTION
      WHEN OTHERS THEN
        RETURN json_build_object(
          'success', false,
          'error', SQLERRM,
          'code', SQLSTATE
        );
    END;
    $$;
    REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
    COMMENT ON FUNCTION public.exec_sql(text) IS 'Executes arbitrary SQL with security considerations.';`

    // Ejecutar directamente contra la BD usando el pool (no requiere service key)
    await pool.query(sql)
    return {
      success: true,
      message: 'Función exec_sql creada exitosamente (pool)',
    }
  } catch (error: any) {
    setResponseStatus(event, 500)
    return { error: `Error en el servidor: ${error.message}` }
  }
})
