# openapi_client.IntegrationsApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**integrations_add_integration**](IntegrationsApi.md#integrations_add_integration) | **POST** /integration/create | Create Integration
[**integrations_associate_integration_with_signing_authority**](IntegrationsApi.md#integrations_associate_integration_with_signing_authority) | **POST** /integration/{integrationId}/associate-with-signing-authority | Associate Integration with Signing Authority
[**integrations_count_integrations**](IntegrationsApi.md#integrations_count_integrations) | **POST** /profile/integrations/count | Count My Integrations
[**integrations_delete_integration**](IntegrationsApi.md#integrations_delete_integration) | **DELETE** /integration/{id} | Delete Integration
[**integrations_get_integration**](IntegrationsApi.md#integrations_get_integration) | **GET** /integration/{id} | Get Integration
[**integrations_get_integrations**](IntegrationsApi.md#integrations_get_integrations) | **POST** /profile/integrations | Get My Integrations
[**integrations_update_integration**](IntegrationsApi.md#integrations_update_integration) | **POST** /integration/update/{id} | Update Integration


# **integrations_add_integration**
> str integrations_add_integration(integrations_add_integration_request)

Create Integration

Create a new Integration for your profile

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.integrations_add_integration_request import IntegrationsAddIntegrationRequest
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to https://network.learncard.com/api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "https://network.learncard.com/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    integrations_add_integration_request = openapi_client.IntegrationsAddIntegrationRequest() # IntegrationsAddIntegrationRequest | 

    try:
        # Create Integration
        api_response = api_instance.integrations_add_integration(integrations_add_integration_request)
        print("The response of IntegrationsApi->integrations_add_integration:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_add_integration: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **integrations_add_integration_request** | [**IntegrationsAddIntegrationRequest**](IntegrationsAddIntegrationRequest.md)|  | 

### Return type

**str**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **integrations_associate_integration_with_signing_authority**
> bool integrations_associate_integration_with_signing_authority(integration_id, integrations_associate_integration_with_signing_authority_request)

Associate Integration with Signing Authority

Associate an Integration with a Signing Authority

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.integrations_associate_integration_with_signing_authority_request import IntegrationsAssociateIntegrationWithSigningAuthorityRequest
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to https://network.learncard.com/api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "https://network.learncard.com/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    integration_id = 'integration_id_example' # str | 
    integrations_associate_integration_with_signing_authority_request = openapi_client.IntegrationsAssociateIntegrationWithSigningAuthorityRequest() # IntegrationsAssociateIntegrationWithSigningAuthorityRequest | 

    try:
        # Associate Integration with Signing Authority
        api_response = api_instance.integrations_associate_integration_with_signing_authority(integration_id, integrations_associate_integration_with_signing_authority_request)
        print("The response of IntegrationsApi->integrations_associate_integration_with_signing_authority:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_associate_integration_with_signing_authority: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **integration_id** | **str**|  | 
 **integrations_associate_integration_with_signing_authority_request** | [**IntegrationsAssociateIntegrationWithSigningAuthorityRequest**](IntegrationsAssociateIntegrationWithSigningAuthorityRequest.md)|  | 

### Return type

**bool**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **integrations_count_integrations**
> float integrations_count_integrations(integrations_count_integrations_request=integrations_count_integrations_request)

Count My Integrations

Get a count of your Integrations matching a query

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.integrations_count_integrations_request import IntegrationsCountIntegrationsRequest
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to https://network.learncard.com/api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "https://network.learncard.com/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    integrations_count_integrations_request = openapi_client.IntegrationsCountIntegrationsRequest() # IntegrationsCountIntegrationsRequest |  (optional)

    try:
        # Count My Integrations
        api_response = api_instance.integrations_count_integrations(integrations_count_integrations_request=integrations_count_integrations_request)
        print("The response of IntegrationsApi->integrations_count_integrations:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_count_integrations: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **integrations_count_integrations_request** | [**IntegrationsCountIntegrationsRequest**](IntegrationsCountIntegrationsRequest.md)|  | [optional] 

### Return type

**float**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **integrations_delete_integration**
> bool integrations_delete_integration(id)

Delete Integration

Delete an Integration by id

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to https://network.learncard.com/api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "https://network.learncard.com/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    id = 'id_example' # str | 

    try:
        # Delete Integration
        api_response = api_instance.integrations_delete_integration(id)
        print("The response of IntegrationsApi->integrations_delete_integration:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_delete_integration: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 

### Return type

**bool**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**404** | Not found |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **integrations_get_integration**
> IntegrationsGetIntegration200Response integrations_get_integration(id)

Get Integration

Get an Integration by id

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.integrations_get_integration200_response import IntegrationsGetIntegration200Response
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to https://network.learncard.com/api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "https://network.learncard.com/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    id = 'id_example' # str | 

    try:
        # Get Integration
        api_response = api_instance.integrations_get_integration(id)
        print("The response of IntegrationsApi->integrations_get_integration:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_get_integration: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 

### Return type

[**IntegrationsGetIntegration200Response**](IntegrationsGetIntegration200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**404** | Not found |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **integrations_get_integrations**
> IntegrationsGetIntegrations200Response integrations_get_integrations(integrations_get_integrations_request=integrations_get_integrations_request)

Get My Integrations

Get your Integrations with cursor-based pagination

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.integrations_get_integrations200_response import IntegrationsGetIntegrations200Response
from openapi_client.models.integrations_get_integrations_request import IntegrationsGetIntegrationsRequest
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to https://network.learncard.com/api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "https://network.learncard.com/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    integrations_get_integrations_request = openapi_client.IntegrationsGetIntegrationsRequest() # IntegrationsGetIntegrationsRequest |  (optional)

    try:
        # Get My Integrations
        api_response = api_instance.integrations_get_integrations(integrations_get_integrations_request=integrations_get_integrations_request)
        print("The response of IntegrationsApi->integrations_get_integrations:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_get_integrations: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **integrations_get_integrations_request** | [**IntegrationsGetIntegrationsRequest**](IntegrationsGetIntegrationsRequest.md)|  | [optional] 

### Return type

[**IntegrationsGetIntegrations200Response**](IntegrationsGetIntegrations200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **integrations_update_integration**
> bool integrations_update_integration(id, integrations_update_integration_request)

Update Integration

Update an Integration by id

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.integrations_update_integration_request import IntegrationsUpdateIntegrationRequest
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to https://network.learncard.com/api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "https://network.learncard.com/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    id = 'id_example' # str | 
    integrations_update_integration_request = openapi_client.IntegrationsUpdateIntegrationRequest() # IntegrationsUpdateIntegrationRequest | 

    try:
        # Update Integration
        api_response = api_instance.integrations_update_integration(id, integrations_update_integration_request)
        print("The response of IntegrationsApi->integrations_update_integration:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_update_integration: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **integrations_update_integration_request** | [**IntegrationsUpdateIntegrationRequest**](IntegrationsUpdateIntegrationRequest.md)|  | 

### Return type

**bool**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

