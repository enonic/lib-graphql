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
import graphql.validation.QueryComplexityLimits;

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

    public Object execute( final GraphQLSchema schema, final String query, final ScriptValue variables, final Object context,
                           final Integer maxDepth, final Integer maxFieldsCount )
    {
        final GraphQL graphQL = GraphQL.newGraphQL( schema ).build();

        final Map<String, Object> variablesMap = variables == null ? Collections.emptyMap() : variables.getMap();

        final ExecutionInput.Builder executionInputBuilder = ExecutionInput.newExecutionInput().
            query( query ).
            context( context ).
            variables( variablesMap );

        // Leaving the key unset keeps graphql-java's static default limits in effect.
        if ( maxDepth != null || maxFieldsCount != null )
        {
            final QueryComplexityLimits limits = createLimits( maxDepth, maxFieldsCount );
            executionInputBuilder.graphQLContext( builder -> builder.put( QueryComplexityLimits.KEY, limits ) );
        }

        final ExecutionResult executionResult = graphQL.execute( executionInputBuilder.build() );

        return new ExecutionResultMapper( executionResult );
    }

    private static QueryComplexityLimits createLimits( final Integer maxDepth, final Integer maxFieldsCount )
    {
        // The builder treats an unset limit as unlimited, so an omitted one keeps the current default instead.
        final QueryComplexityLimits defaults = QueryComplexityLimits.getDefaultLimits();
        return QueryComplexityLimits.newLimits().
            maxDepth( maxDepth != null ? maxDepth : defaults.getMaxDepth() ).
            maxFieldsCount( maxFieldsCount != null ? maxFieldsCount : defaults.getMaxFieldsCount() ).
            build();
    }
}
