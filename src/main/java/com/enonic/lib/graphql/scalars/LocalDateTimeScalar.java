package com.enonic.lib.graphql.scalars;

import java.time.DateTimeException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

import graphql.language.StringValue;
import graphql.scalars.util.Kit;
import graphql.schema.Coercing;
import graphql.schema.CoercingParseLiteralException;
import graphql.schema.CoercingParseValueException;
import graphql.schema.CoercingSerializeException;
import graphql.schema.GraphQLScalarType;

public class LocalDateTimeScalar
{
    private LocalDateTimeScalar()
    {
    }

    private static Coercing<LocalDateTime, String> COERCING = new Coercing<>()
    {
        @Override
        public String serialize( Object input )
            throws CoercingSerializeException
        {
            try
            {
                if ( input instanceof LocalDateTime )
                {
                    return DateTimeFormatter.ISO_LOCAL_DATE_TIME.format( ( (LocalDateTime) input ) );
                }
                else
                {
                    if ( !( input instanceof String ) )
                    {
                        throw new CoercingSerializeException(
                            String.format( "Expected something what can convert to 'java.time.LocalDateTime' but was '%s'",
                                           Kit.typeName( input ) ) );
                    }

                    LocalDateTime.parse( input.toString(), DateTimeFormatter.ISO_LOCAL_DATE_TIME );
                    // returns actual value if input is a valid
                    return input.toString();
                }
            }
            catch ( DateTimeException e )
            {
                throw new CoercingSerializeException( e );
            }
        }

        @Override
        public LocalDateTime parseValue( Object input )
            throws CoercingParseValueException
        {
            if ( input instanceof LocalDateTime )
            {
                return (LocalDateTime) input;
            }

            if ( !( input instanceof String ) )
            {
                throw new CoercingParseValueException( String.format( "Expected a 'String' but was '%s'.", Kit.typeName( input ) ) );
            }

            try
            {
                return LocalDateTime.parse( input.toString(), DateTimeFormatter.ISO_LOCAL_DATE_TIME );
            }
            catch ( DateTimeParseException e )
            {
                throw new CoercingParseValueException( e );
            }
        }

        @Override
        public LocalDateTime parseLiteral( Object input )
            throws CoercingParseLiteralException
        {
            if ( !( input instanceof StringValue ) )
            {
                throw new CoercingParseLiteralException( String.format( "Expected 'StringValue' but was '%s'.", Kit.typeName( input ) ) );
            }

            try
            {
                return LocalDateTime.parse( ( (StringValue) input ).getValue(), DateTimeFormatter.ISO_LOCAL_DATE_TIME );
            }
            catch ( DateTimeParseException e )
            {
                throw new CoercingParseLiteralException( e );
            }
        }
    };

    public static GraphQLScalarType newLocalDateTime()
    {
        return GraphQLScalarType.newScalar().
            name( "LocalDateTime" ).
            description( "LocalDateTime scalar" ).
            coercing( COERCING ).
            build();
    }
}
