package com.enonic.lib.graphql.scalars;

import java.time.DateTimeException;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.Temporal;

import graphql.language.StringValue;
import graphql.scalars.util.Kit;
import graphql.schema.Coercing;
import graphql.schema.CoercingParseLiteralException;
import graphql.schema.CoercingParseValueException;
import graphql.schema.CoercingSerializeException;
import graphql.schema.GraphQLScalarType;

public class LocalTimeScalar
{
    private LocalTimeScalar()
    {
    }

    private static Coercing<LocalTime, String> COERCING = new Coercing<>()
    {
        @Override
        public String serialize( Object input )
            throws CoercingSerializeException
        {
            try
            {
                if ( input instanceof LocalTime )
                {
                    return DateTimeFormatter.ISO_LOCAL_TIME.format( ( (LocalTime) input ) );
                }
                else
                {
                    if ( !( input instanceof String ) )
                    {
                        throw new CoercingSerializeException(
                            String.format( "Expected something what can convert to 'java.time.LocalTime' but was '%s'",
                                           Kit.typeName( input ) ) );
                    }

                    LocalTime.parse( input.toString(), DateTimeFormatter.ISO_LOCAL_TIME );
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
        public LocalTime parseValue( Object input )
            throws CoercingParseValueException
        {
            if ( input instanceof Temporal )
            {
                return (LocalTime) input;
            }

            if ( !( input instanceof String ) )
            {
                throw new CoercingParseValueException( String.format( "Expected a 'String' but was '%s'.", Kit.typeName( input ) ) );
            }

            try
            {
                return LocalTime.parse( input.toString(), DateTimeFormatter.ISO_LOCAL_TIME );
            }
            catch ( DateTimeParseException e )
            {
                throw new CoercingParseValueException( e );
            }
        }

        @Override
        public LocalTime parseLiteral( Object input )
            throws CoercingParseLiteralException
        {
            if ( !( input instanceof StringValue ) )
            {
                throw new CoercingParseLiteralException( String.format( "Expected 'StringValue' but was '%s'.", Kit.typeName( input ) ) );
            }

            try
            {
                return LocalTime.parse( ( (StringValue) input ).getValue(), DateTimeFormatter.ISO_LOCAL_TIME );
            }
            catch ( DateTimeParseException e )
            {
                throw new CoercingParseLiteralException( e );
            }
        }
    };

    public static GraphQLScalarType newLocalTime()
    {
        return GraphQLScalarType.newScalar().
            name( "LocalTime" ).
            description( "LocalTime scalar" ).
            coercing( COERCING ).
            build();
    }
}
