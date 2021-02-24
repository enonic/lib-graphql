package com.enonic.lib.graphql;

import graphql.schema.GraphQLScalarType;

import com.enonic.lib.graphql.scalars.LocalDateTimeScalar;
import com.enonic.lib.graphql.scalars.LocalTimeScalar;

public class CustomScalars
{
    public static final GraphQLScalarType LocalDateTime = LocalDateTimeScalar.newLocalDateTime();

    public static final GraphQLScalarType LocalTime = LocalTimeScalar.newLocalTime();

    private CustomScalars()
    {
    }
}
