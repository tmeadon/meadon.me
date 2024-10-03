import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { Resource } from '@opentelemetry/resources'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

// TODO: exclude @opentelemetry/instrumentation-fs telemetry

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: "myapp"
  }),
  metricReader: new PrometheusExporter({
    port: 9464, // optional - default is 9464
  }),
  instrumentations: [getNodeAutoInstrumentations({
    "@opentelemetry/instrumentation-fs": {
      enabled: false
    }
  })],
  spanProcessors: [
    new SimpleSpanProcessor(new ConsoleSpanExporter()),
    new SimpleSpanProcessor(new OTLPTraceExporter({
      url: "http://localhost:4318/v1/traces"
    }))
  ]
});


sdk.start();
