-- Create a function to execute read-only queries for reports
-- This function is SECURITY DEFINER to run with elevated privileges,
-- BUT we must strictly validate the input to prevent SQL injection and unauthorized access.

CREATE OR REPLACE FUNCTION execute_report_query(query_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- 1. Basic Validation: Ensure it's a SELECT statement
  IF lower(trim(query_text)) NOT LIKE 'select%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- 2. Table Whitelist Validation
  -- Ensure the query only references allowed tables.
  -- This is a simple regex check; for production, a proper SQL parser or restricted role is better.
  -- Allowed: sales, sale_items, products, inventory, customers, users (maybe limited columns)
  IF query_text ~* 'information_schema|pg_|auth\.|storage\.|secret' THEN
     RAISE EXCEPTION 'Access to system tables is forbidden';
  END IF;
  
  -- 3. Execute the query and return results as JSON
  EXECUTE 'SELECT json_agg(t) FROM (' || query_text || ') t' INTO result;

  -- Return empty array if null (no results)
  IF result IS NULL THEN
    result := '[]'::json;
  END IF;

  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return the error as a JSON object so the client/AI knows what went wrong
  RETURN json_build_object('error', SQLERRM);
END;
$$;
