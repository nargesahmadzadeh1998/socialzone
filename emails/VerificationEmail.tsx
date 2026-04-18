import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

export default function VerificationEmail({ name, url }: { name: string; url: string }) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email to finish signup</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ padding: "24px", backgroundColor: "white", margin: "24px auto", maxWidth: 480 }}>
          <Heading as="h2">Hey {name},</Heading>
          <Text>Confirm your email address to activate your Community Builder account.</Text>
          <Button href={url} style={{ background: "#111", color: "white", padding: "10px 16px", borderRadius: 6 }}>
            Verify email
          </Button>
          <Text style={{ fontSize: 12, color: "#666", marginTop: 24 }}>
            Or paste this link: {url}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
