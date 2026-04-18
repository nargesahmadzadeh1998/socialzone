import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

export default function RegistrationConfirmationEmail({
  name,
  eventTitle,
  startsAt,
}: {
  name: string;
  eventTitle: string;
  startsAt: Date;
}) {
  return (
    <Html>
      <Head />
      <Preview>You're registered for {eventTitle}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ padding: "24px", backgroundColor: "white", margin: "24px auto", maxWidth: 480 }}>
          <Heading as="h2">You're in, {name}!</Heading>
          <Text>
            You've been registered for <strong>{eventTitle}</strong>.
          </Text>
          <Text>
            It starts {new Date(startsAt).toUTCString()}.
          </Text>
          <Text>We'll send a reminder on the day of the event.</Text>
        </Container>
      </Body>
    </Html>
  );
}
