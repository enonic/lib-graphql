package com.enonic.lib.graphql.scalars;

import java.time.LocalDateTime;

import org.junit.Test;

import graphql.language.StringValue;
import graphql.schema.Coercing;
import graphql.schema.CoercingParseLiteralException;
import graphql.schema.CoercingParseValueException;
import graphql.schema.CoercingSerializeException;

import static org.junit.Assert.*;

public class LocalDateTimeScalarTest
{
    @Test
    public void testSerialize()
    {
        Coercing coercing = LocalDateTimeScalar.newLocalDateTime().getCoercing();

        assertEquals( "2020-04-12T21:20:50", coercing.serialize( "2020-04-12T21:20:50" ).toString() );
        assertEquals( "2020-12-19T16:40:00", coercing.serialize( "2020-12-19T16:40" ).toString() );
        assertEquals( "2020-01-01T12:00:27", coercing.serialize( LocalDateTime.parse( "2020-01-01T12:00:27" ) ).toString() );
        assertThrows( CoercingSerializeException.class, () -> coercing.serialize( 1L ) );
        assertThrows( CoercingSerializeException.class, () -> coercing.serialize( "2020-01-01T12" ) );
    }

    @Test
    public void testParseValue()
    {
        Coercing coercing = LocalDateTimeScalar.newLocalDateTime().getCoercing();

        assertEquals( LocalDateTime.parse( "2020-04-12T21:20:50" ), coercing.parseValue( "2020-04-12T21:20:50" ) );
        assertEquals( LocalDateTime.parse( "2020-04-12T21:20:00" ), coercing.parseValue( LocalDateTime.parse( "2020-04-12T21:20" ) ) );
        assertThrows( CoercingParseValueException.class, () -> coercing.parseValue( null ) );
        assertThrows( CoercingParseValueException.class, () -> coercing.parseValue( "2020-04-12T21" ) );
    }

    @Test
    public void testParseLiteral()
    {
        Coercing coercing = LocalDateTimeScalar.newLocalDateTime().getCoercing();

        assertEquals( LocalDateTime.parse( "2020-04-12T21:20:50" ), coercing.parseLiteral( new StringValue( "2020-04-12T21:20:50" ) ) );
        assertThrows( CoercingParseLiteralException.class, () -> coercing.parseLiteral( 1L ) );
        assertThrows( CoercingParseLiteralException.class, () -> coercing.parseLiteral( new StringValue( "2020-04-12T21" ) ) );
    }
}
