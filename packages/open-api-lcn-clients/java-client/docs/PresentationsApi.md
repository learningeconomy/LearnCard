# PresentationsApi

All URIs are relative to *https://network.learncard.com/api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**presentationAcceptPresentation**](PresentationsApi.md#presentationAcceptPresentation) | **POST** /presentation/accept | Accept a Presentation |
| [**presentationDeletePresentation**](PresentationsApi.md#presentationDeletePresentation) | **DELETE** /presentation | Delete a presentation |
| [**presentationIncomingPresentations**](PresentationsApi.md#presentationIncomingPresentations) | **GET** /presentation/incoming | Get incoming presentations |
| [**presentationReceivedPresentations**](PresentationsApi.md#presentationReceivedPresentations) | **GET** /presentation/received | Get received presentations |
| [**presentationSendPresentation**](PresentationsApi.md#presentationSendPresentation) | **POST** /presentation/send/{profileId} | Send a Presentation |
| [**presentationSentPresentations**](PresentationsApi.md#presentationSentPresentations) | **GET** /presentation/sent | Get sent presentations |


<a id="presentationAcceptPresentation"></a>
# **presentationAcceptPresentation**
> Boolean presentationAcceptPresentation(presentationAcceptPresentationRequest)

Accept a Presentation

This endpoint accepts a presentation

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.PresentationsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    PresentationsApi apiInstance = new PresentationsApi(defaultClient);
    PresentationAcceptPresentationRequest presentationAcceptPresentationRequest = new PresentationAcceptPresentationRequest(); // PresentationAcceptPresentationRequest | 
    try {
      Boolean result = apiInstance.presentationAcceptPresentation(presentationAcceptPresentationRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling PresentationsApi#presentationAcceptPresentation");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **presentationAcceptPresentationRequest** | [**PresentationAcceptPresentationRequest**](PresentationAcceptPresentationRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="presentationDeletePresentation"></a>
# **presentationDeletePresentation**
> Boolean presentationDeletePresentation(uri)

Delete a presentation

This endpoint deletes a presentation

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.PresentationsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    PresentationsApi apiInstance = new PresentationsApi(defaultClient);
    String uri = "uri_example"; // String | 
    try {
      Boolean result = apiInstance.presentationDeletePresentation(uri);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling PresentationsApi#presentationDeletePresentation");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **uri** | **String**|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="presentationIncomingPresentations"></a>
# **presentationIncomingPresentations**
> List&lt;CredentialReceivedCredentials200ResponseInner&gt; presentationIncomingPresentations(limit, from)

Get incoming presentations

This endpoint returns the current user&#39;s incoming presentations

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.PresentationsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    PresentationsApi apiInstance = new PresentationsApi(defaultClient);
    Integer limit = 25; // Integer | 
    String from = "from_example"; // String | 
    try {
      List<CredentialReceivedCredentials200ResponseInner> result = apiInstance.presentationIncomingPresentations(limit, from);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling PresentationsApi#presentationIncomingPresentations");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **limit** | **Integer**|  | [optional] [default to 25] |
| **from** | **String**|  | [optional] |

### Return type

[**List&lt;CredentialReceivedCredentials200ResponseInner&gt;**](CredentialReceivedCredentials200ResponseInner.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="presentationReceivedPresentations"></a>
# **presentationReceivedPresentations**
> List&lt;CredentialReceivedCredentials200ResponseInner&gt; presentationReceivedPresentations(limit, from)

Get received presentations

This endpoint returns the current user&#39;s received presentations

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.PresentationsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    PresentationsApi apiInstance = new PresentationsApi(defaultClient);
    Integer limit = 25; // Integer | 
    String from = "from_example"; // String | 
    try {
      List<CredentialReceivedCredentials200ResponseInner> result = apiInstance.presentationReceivedPresentations(limit, from);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling PresentationsApi#presentationReceivedPresentations");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **limit** | **Integer**|  | [optional] [default to 25] |
| **from** | **String**|  | [optional] |

### Return type

[**List&lt;CredentialReceivedCredentials200ResponseInner&gt;**](CredentialReceivedCredentials200ResponseInner.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="presentationSendPresentation"></a>
# **presentationSendPresentation**
> String presentationSendPresentation(profileId, presentationSendPresentationRequest)

Send a Presentation

This endpoint sends a presentation to a user based on their profileId

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.PresentationsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    PresentationsApi apiInstance = new PresentationsApi(defaultClient);
    String profileId = "profileId_example"; // String | 
    PresentationSendPresentationRequest presentationSendPresentationRequest = new PresentationSendPresentationRequest(); // PresentationSendPresentationRequest | 
    try {
      String result = apiInstance.presentationSendPresentation(profileId, presentationSendPresentationRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling PresentationsApi#presentationSendPresentation");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileId** | **String**|  | |
| **presentationSendPresentationRequest** | [**PresentationSendPresentationRequest**](PresentationSendPresentationRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="presentationSentPresentations"></a>
# **presentationSentPresentations**
> List&lt;CredentialReceivedCredentials200ResponseInner&gt; presentationSentPresentations(limit, to)

Get sent presentations

This endpoint returns the current user&#39;s sent presentations

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.PresentationsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    PresentationsApi apiInstance = new PresentationsApi(defaultClient);
    Integer limit = 25; // Integer | 
    String to = "to_example"; // String | 
    try {
      List<CredentialReceivedCredentials200ResponseInner> result = apiInstance.presentationSentPresentations(limit, to);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling PresentationsApi#presentationSentPresentations");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **limit** | **Integer**|  | [optional] [default to 25] |
| **to** | **String**|  | [optional] |

### Return type

[**List&lt;CredentialReceivedCredentials200ResponseInner&gt;**](CredentialReceivedCredentials200ResponseInner.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

