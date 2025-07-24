# openapi_client.WorkflowsApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**workflows_participate_in_exchange**](WorkflowsApi.md#workflows_participate_in_exchange) | **POST** /workflows/{localWorkflowId}/exchanges/{localExchangeId} | Participate in an Exchange


# **workflows_participate_in_exchange**
> WorkflowsParticipateInExchange200Response workflows_participate_in_exchange(local_workflow_id, local_exchange_id, workflows_participate_in_exchange_request)

Participate in an Exchange

VC-API endpoint for participating in credential exchanges. Supports both exchange initiation and credential claiming.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.workflows_participate_in_exchange200_response import WorkflowsParticipateInExchange200Response
from openapi_client.models.workflows_participate_in_exchange_request import WorkflowsParticipateInExchangeRequest
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
    api_instance = openapi_client.WorkflowsApi(api_client)
    local_workflow_id = 'local_workflow_id_example' # str | 
    local_exchange_id = 'local_exchange_id_example' # str | 
    workflows_participate_in_exchange_request = openapi_client.WorkflowsParticipateInExchangeRequest() # WorkflowsParticipateInExchangeRequest | 

    try:
        # Participate in an Exchange
        api_response = api_instance.workflows_participate_in_exchange(local_workflow_id, local_exchange_id, workflows_participate_in_exchange_request)
        print("The response of WorkflowsApi->workflows_participate_in_exchange:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling WorkflowsApi->workflows_participate_in_exchange: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **local_workflow_id** | **str**|  | 
 **local_exchange_id** | **str**|  | 
 **workflows_participate_in_exchange_request** | [**WorkflowsParticipateInExchangeRequest**](WorkflowsParticipateInExchangeRequest.md)|  | 

### Return type

[**WorkflowsParticipateInExchange200Response**](WorkflowsParticipateInExchange200Response.md)

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

