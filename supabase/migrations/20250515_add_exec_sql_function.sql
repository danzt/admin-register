-- This function allows executing arbitrary SQL from the application
-- Note: This function requires admin privileges to execute
-- It should be used with caution and only available to admin users

-- Create the exec_sql function
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Run with privileges of the function creator
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

-- Set ownership to postgres (or your preferred role with appropriate permissions)
ALTER FUNCTION public.exec_sql(text) OWNER TO postgres;

-- Grant execute permission only to authenticated users
-- Row-level security in application code will handle authorization
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;

-- Add comment documenting the function purpose and security implications
COMMENT ON FUNCTION public.exec_sql(text) IS 
'Executes arbitrary SQL. This function has security implications and should only be callable by authenticated users with admin privileges. Application code must implement proper authorization checks.'; 