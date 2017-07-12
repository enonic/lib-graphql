package com.enonic.lib.graphql;

import java.util.Base64;

public class CursorHelper
{
    public static String encode(final String value) {
        final byte[] encodedBytes = Base64.getEncoder().encode( value.getBytes() );
        return new String( encodedBytes );
    }
    public static String decode(final String value) {
        final byte[] decodedBytes = Base64.getDecoder().decode( value.getBytes() );
        return new String( decodedBytes );
    }
}
