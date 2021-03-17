package com.enonic.lib.graphql.scalars;

import java.time.LocalTime;

import org.junit.Test;

import graphql.language.StringValue;
import graphql.schema.Coercing;
import graphql.schema.CoercingParseLiteralException;
import graphql.schema.CoercingParseValueException;
import graphql.schema.CoercingSerializeException;

import static org.junit.Assert.*;

public class LocalTimeScalarTest
{
    @Test
    public void testSerialize()
    {
        Coercing coercing = LocalTimeScalar.newLocalTime().getCoercing();

        assertEquals( "21:20:50", coercing.serialize( "21:20:50" ).toString() );
        assertEquals( "16:40", coercing.serialize( "16:40" ).toString() );
        assertEquals( "12:00:27", coercing.serialize( LocalTime.parse( "12:00:27" ) ).toString() );
        assertThrows( CoercingSerializeException.class, () -> coercing.serialize( 1L ) );
        assertThrows( CoercingSerializeException.class, () -> coercing.serialize( "12" ) );
    }

    @Test
    public void testParseValue()
    {
        Coercing coercing = LocalTimeScalar.newLocalTime().getCoercing();

        assertEquals( LocalTime.parse( "21:20:50" ), coercing.parseValue( "21:20:50" ) );
        assertEquals( LocalTime.parse( "21:20" ), coercing.parseValue( LocalTime.parse( "21:20" ) ) );
        assertThrows( CoercingParseValueException.class, () -> coercing.parseValue( null ) );
        assertThrows( CoercingParseValueException.class, () -> coercing.parseValue( "21" ) );
    }

    @Test
    public void testParseLiteral()
    {
        Coercing coercing = LocalTimeScalar.newLocalTime().getCoercing();

        assertEquals( LocalTime.parse( "21:20:50" ), coercing.parseLiteral( new StringValue( "21:20:50" ) ) );
        assertThrows( CoercingParseLiteralException.class, () -> coercing.parseLiteral( 1L ) );
        assertThrows( CoercingParseLiteralException.class, () -> coercing.parseLiteral( new StringValue( "21" ) ) );
    }
}
