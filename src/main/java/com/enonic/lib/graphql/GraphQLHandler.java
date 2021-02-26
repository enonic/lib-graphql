package com.enonic.lib.graphql;

import java.util.Collections;
import java.util.Map;

import graphql.ExecutionInput;
import graphql.ExecutionResult;
import graphql.GraphQL;
import graphql.schema.GraphQLList;
import graphql.schema.GraphQLNonNull;
import graphql.schema.GraphQLSchema;
import graphql.schema.GraphQLType;
import graphql.schema.GraphQLTypeReference;

import com.enonic.xp.script.ScriptValue;

public class GraphQLHandler
{
    public GraphQLList list( GraphQLType type )
    {
        return new GraphQLList( type );
    }

    public GraphQLNonNull nonNull( GraphQLType type )
    {
        return new GraphQLNonNull( type );
    }

    public GraphQLTypeReference reference( final String typeKey )
    {
        return new GraphQLTypeReference( typeKey );
    }

    public Object execute( final GraphQLSchema schema, final String query, final ScriptValue variables, final Object context )
    {
        final GraphQL graphQL = GraphQL.newGraphQL( schema ).build();

        final Map<String, Object> variablesMap = variables == null ? Collections.emptyMap() : variables.getMap();

        final ExecutionInput executionInput = ExecutionInput.newExecutionInput().
            query( query ).
            context( context ).
            variables( variablesMap ).
            build();

        final ExecutionResult executionResult = graphQL.execute( executionInput );

        return new ExecutionResultMapper( executionResult );
    }
}
