package com.enonic.lib.graphql;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GraphqlBundleTest
{
    @Test
    void connectionRequiresGraphqlInsteadOfBundlingIt()
        throws IOException
    {
        final String bundle = readBundle( "/lib/graphql-connection.js" );

        assertTrue( bundle.contains( "require(\"./graphql\")" ), bundle );
        assertFalse( bundle.contains( "com.enonic.lib.graphql.GraphQLHandler" ), bundle );
        assertFalse( bundle.contains( "com.enonic.lib.graphql.GraphQlBean" ), bundle );
    }

    @Test
    void rxHasNoRuntimeDependencyOnGraphql()
        throws IOException
    {
        final String bundle = readBundle( "/lib/graphql-rx.js" );

        assertFalse( bundle.contains( "require(\"./graphql\")" ), bundle );
        assertFalse( bundle.contains( "com.enonic.lib.graphql.GraphQLHandler" ), bundle );
    }

    private String readBundle( final String path )
        throws IOException
    {
        try (InputStream stream = getClass().getResourceAsStream( path ))
        {
            assertNotNull( stream, path );
            return new String( stream.readAllBytes(), StandardCharsets.UTF_8 );
        }
    }
}
