package com.enonic.lib.graphql;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.stream.Collectors;

import graphql.schema.DataFetcher;
import graphql.schema.FieldCoordinates;
import graphql.schema.GraphQLArgument;
import graphql.schema.GraphQLCodeRegistry;
import graphql.schema.GraphQLEnumType;
import graphql.schema.GraphQLFieldDefinition;
import graphql.schema.GraphQLInputObjectField;
import graphql.schema.GraphQLInputObjectType;
import graphql.schema.GraphQLInputType;
import graphql.schema.GraphQLInterfaceType;
import graphql.schema.GraphQLObjectType;
import graphql.schema.GraphQLOutputType;
import graphql.schema.GraphQLSchema;
import graphql.schema.GraphQLTypeReference;
import graphql.schema.GraphQLUnionType;

import com.enonic.lib.graphql.rx.PublishProcessor;
import com.enonic.xp.script.ScriptValue;

public class GraphQlBean
{
    private GraphQLCodeRegistry.Builder codeRegistryBuilder = GraphQLCodeRegistry.newCodeRegistry();

    private GraphQLObjectType pageInfoObjectType;

    public GraphQLSchema createSchema( final GraphQLObjectType queryObjectType, final GraphQLObjectType mutationObjectType,
                                       final GraphQLObjectType subscriptionObjectType, final GraphQLObjectType[] additionalTypes )
    {
        final GraphQLSchema.Builder graphQLSchema = GraphQLSchema.newSchema().query( queryObjectType );
        if ( mutationObjectType != null )
        {
            graphQLSchema.mutation( mutationObjectType );
        }
        if ( subscriptionObjectType != null )
        {
            graphQLSchema.subscription( subscriptionObjectType );
        }
        if ( additionalTypes != null )
        {
            graphQLSchema.additionalTypes( new HashSet<>( Arrays.asList( additionalTypes ) ) );
        }

        graphQLSchema.codeRegistry( codeRegistryBuilder.build() );

        return graphQLSchema.build();
    }

    public GraphQLObjectType createPageInfoObjectType( final String name, final ScriptValue fieldsScriptValue,
                                                       final ScriptValue interfacesScriptValue, final String description )
    {
        if ( pageInfoObjectType != null )
        {
            return pageInfoObjectType;
        }

        pageInfoObjectType = createObjectType( name, fieldsScriptValue, interfacesScriptValue, description );

        return pageInfoObjectType;
    }

    public GraphQLObjectType createObjectType( final String name, final ScriptValue fieldsScriptValue,
                                               final ScriptValue interfacesScriptValue, final String description )
    {
        final GraphQLObjectType.Builder objectType = GraphQLObjectType.newObject().name( name ).description( description );
        if ( interfacesScriptValue != null )
        {
            interfacesScriptValue.getArray().forEach( ( interfaceScriptValue ) -> {
                final Object interfaceValue = interfaceScriptValue.getValue();
                if ( interfaceValue instanceof GraphQLInterfaceType )
                {
                    objectType.withInterface( (GraphQLInterfaceType) interfaceValue );
                }
                else if ( interfaceValue instanceof GraphQLTypeReference )
                {
                    objectType.withInterface( (GraphQLTypeReference) interfaceValue );
                }
            } );
        }
        setTypeFields( name, fieldsScriptValue, objectType );
        return objectType.build();
    }

    public GraphQLInputObjectType createInputObjectType( final String name, final ScriptValue fieldsScriptValue, final String description )
    {
        final GraphQLInputObjectType.Builder objectType = GraphQLInputObjectType.newInputObject().name( name ).description( description );
        setTypeFields( fieldsScriptValue, objectType );
        return objectType.build();
    }

    public GraphQLInterfaceType createInterfaceType( final String name, final ScriptValue fieldsScriptValue,
                                                     final ScriptValue typeResolverScriptValue, final String description )
    {
        final GraphQLInterfaceType.Builder interfaceType = GraphQLInterfaceType.newInterface().name( name ).description( description );

        codeRegistryBuilder.typeResolver( name, ( typeResolutionEnvironment ) -> {
            final MapMapper mapMapper = new MapMapper( (Map<?, ?>) typeResolutionEnvironment.getObject() );
            return (GraphQLObjectType) typeResolverScriptValue.call( mapMapper ).getValue();
        } );

        setTypeFields( fieldsScriptValue, interfaceType );
        return interfaceType.build();
    }

    public GraphQLUnionType createUnionType( final String name, final ScriptValue possibleTypesValue,
                                             final ScriptValue typeResolverScriptValue, final String description )
    {
        final GraphQLUnionType.Builder unionType = GraphQLUnionType.newUnionType().name( name ).description( description );

        if ( possibleTypesValue != null )
        {
            possibleTypesValue.getArray().forEach( ( possibleType ) -> {
                final Object possibleTypeValue = possibleType.getValue();
                if ( possibleTypeValue instanceof GraphQLObjectType )
                {
                    unionType.possibleType( (GraphQLObjectType) possibleTypeValue );
                }
                else if ( possibleTypeValue instanceof GraphQLTypeReference )
                {
                    unionType.possibleType( (GraphQLTypeReference) possibleTypeValue );
                }
            } );
        }

        codeRegistryBuilder.typeResolver( name, ( typeResolutionEnvironment ) -> {
            final MapMapper mapMapper = new MapMapper( (Map<?, ?>) typeResolutionEnvironment.getObject() );
            return (GraphQLObjectType) typeResolverScriptValue.call( mapMapper ).getValue();
        } );

        return unionType.build();
    }

    public GraphQLEnumType createEnumType( final String name, final ScriptValue valuesScriptValue, final String description )
    {
        final GraphQLEnumType.Builder enumType = GraphQLEnumType.newEnum().name( name ).description( description );
        setValues( valuesScriptValue, enumType );
        return enumType.build();
    }

    private void setValues( final ScriptValue valuesScriptValue, final GraphQLEnumType.Builder enumType )
    {
        if ( valuesScriptValue.isArray() )
        {
            valuesScriptValue.getArray( String.class ).forEach( enumType::value );
        }
        else if ( valuesScriptValue.isObject() )
        {
            for ( String valueKey : valuesScriptValue.getKeys() )
            {
                final ScriptValue valueScriptValue = valuesScriptValue.getMember( valueKey );
                enumType.value( valueKey, valueScriptValue.getValue() );
            }
        }
    }

    private void setTypeFields( final String parentTypeName, final ScriptValue fieldsScriptValue,
                                final GraphQLObjectType.Builder objectType )
    {
        for ( String fieldKey : fieldsScriptValue.getKeys() )
        {
            final ScriptValue fieldScriptValue = fieldsScriptValue.getMember( fieldKey );

            if ( fieldScriptValue != null )
            {
                final GraphQLFieldDefinition.Builder graphQlField = GraphQLFieldDefinition.newFieldDefinition().name( fieldKey );

                setFieldArguments( fieldScriptValue, graphQlField );
                setFieldType( fieldScriptValue, graphQlField );
                setFieldData( parentTypeName, fieldKey, fieldScriptValue );
                objectType.field( graphQlField );
            }
        }
    }

    private void setTypeFields( final ScriptValue fieldsScriptValue, final GraphQLInputObjectType.Builder objectType )
    {
        for ( String fieldKey : fieldsScriptValue.getKeys() )
        {
            final ScriptValue fieldScriptValue = fieldsScriptValue.getMember( fieldKey );

            final GraphQLInputObjectField.Builder graphQlField = GraphQLInputObjectField.newInputObjectField().name( fieldKey );

            setFieldType( fieldScriptValue, graphQlField );
            objectType.field( graphQlField );
        }
    }

    private void setTypeFields( final ScriptValue fieldsScriptValue, final GraphQLInterfaceType.Builder interfaceType )
    {
        for ( String fieldKey : fieldsScriptValue.getKeys() )
        {
            final ScriptValue fieldScriptValue = fieldsScriptValue.getMember( fieldKey );

            final GraphQLFieldDefinition.Builder graphQlField = GraphQLFieldDefinition.newFieldDefinition().name( fieldKey );

            setFieldArguments( fieldScriptValue, graphQlField );
            setFieldType( fieldScriptValue, graphQlField );
            interfaceType.field( graphQlField );
        }
    }

    private void setFieldArguments( final ScriptValue fieldScriptValue, final GraphQLFieldDefinition.Builder graphQlField )
    {
        final ScriptValue argsScriptValue = fieldScriptValue.getMember( "args" );
        if ( argsScriptValue != null )
        {
            Map<String, Object> argsMap = fieldScriptValue.getMember( "args" ).getMap();
            argsMap.entrySet()
                .stream()
                .map( ( argEntry ) -> GraphQLArgument.newArgument()
                    .name( argEntry.getKey() )
                    .type( (GraphQLInputType) argEntry.getValue() )
                    .build() )
                .forEach( graphQlField::argument );
        }
    }

    private void setFieldType( final ScriptValue fieldScriptValue, final GraphQLFieldDefinition.Builder graphQlField )
    {
        final Object scriptFieldType = fieldScriptValue.getMember( "type" ).getValue();
        if ( scriptFieldType instanceof GraphQLObjectType.Builder )
        {
            graphQlField.type( (GraphQLObjectType.Builder) scriptFieldType );
        }
        else if ( scriptFieldType instanceof GraphQLInterfaceType.Builder )
        {
            graphQlField.type( (GraphQLInterfaceType.Builder) scriptFieldType );
        }
        else if ( scriptFieldType instanceof GraphQLUnionType.Builder )
        {
            graphQlField.type( (GraphQLUnionType.Builder) scriptFieldType );
        }
        else if ( scriptFieldType instanceof GraphQLOutputType )
        {
            graphQlField.type( (GraphQLOutputType) scriptFieldType );
        }
    }

    private void setFieldType( final ScriptValue fieldScriptValue, final GraphQLInputObjectField.Builder graphQlField )
    {
        final Object scriptFieldType = fieldScriptValue.getMember( "type" ).getValue();
        if ( scriptFieldType instanceof GraphQLInputObjectType.Builder )
        {
            graphQlField.type( (GraphQLInputObjectType.Builder) scriptFieldType );
        }
        else if ( scriptFieldType instanceof GraphQLInputType )
        {
            graphQlField.type( (GraphQLInputType) scriptFieldType );
        }
    }

    private void setFieldData( final String objectTypeName, final String fieldName, final ScriptValue scriptFieldValue )
    {
        final ScriptValue resolve = scriptFieldValue.getMember( "resolve" );

        if ( resolve != null )
        {
            codeRegistryBuilder.dataFetcher( FieldCoordinates.coordinates( objectTypeName, fieldName ), (DataFetcher<Object>) env -> {
                if ( resolve.isFunction() )
                {
                    final DataFetchingEnvironmentMapper environmentMapper = new DataFetchingEnvironmentMapper( env );
                    final ScriptValue result = resolve.call( environmentMapper );
                    return toGraphQlValue( result );
                }
                else
                {
                    return toGraphQlValue( resolve );
                }
            } );
        }
    }

    private Object toGraphQlValue( final ScriptValue data )
    {
        if ( data != null )
        {
            if ( data.isValue() )
            {
                return data.getValue();
            }
            else if ( data.isObject() )
            {
                if ( data.getValue() instanceof PublishProcessor )
                {
                    return data.getValue();
                }
                else
                {
                    return data.getMap();
                }
            }
            else if ( data.isArray() )
            {
                return data.getArray().stream().map( this::toGraphQlValue ).collect( Collectors.toList() );
            }
        }
        return null;
    }
}
